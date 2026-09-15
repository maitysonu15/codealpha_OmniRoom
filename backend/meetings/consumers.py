import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from asgiref.sync import sync_to_async
from django.utils import timezone

class MeetingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.meeting_code = self.scope['url_route']['kwargs']['meeting_code']
        self.room_group_name = f"meeting_{self.meeting_code}"
        self.user = self.scope.get("user")
        
        # Check query params for display name
        query_string = self.scope.get("query_string", b"").decode("utf-8")
        query_params = dict(qp.split("=", 1) for qp in query_string.split("&") if "=" in qp) if query_string else {}
        display_name = query_params.get("name")

        if display_name:
            self.user_name = display_name
        elif self.user and self.user.is_authenticated:
            self.user_name = self.user.username
        else:
            self.user_name = "Guest User"

        self.user_id = self.user.id if self.user and self.user.is_authenticated else None

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Send connection confirmation to client
        await self.send_json({
            'type': 'connection_established',
            'meeting_code': self.meeting_code,
            'user': self.user_name,
            'channel_name': self.channel_name,
            'message': f'Successfully connected to meeting {self.meeting_code}'
        })

        # Broadcast user join event to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined_event',
                'user': self.user_name,
                'sender_channel': self.channel_name
            }
        )

    async def disconnect(self, close_code):
        # Broadcast user left event to room
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_left_event',
                    'user': getattr(self, 'user_name', 'Guest User'),
                    'sender_channel': self.channel_name
                }
            )

            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        msg_type = content.get('type')
        target_channel = content.get('target_channel')
        sender_name = content.get('sender') or self.user_name

        # Persist chat messages to DB if type is chat_message
        if msg_type == 'chat_message':
            text = content.get('message', '')
            if text:
                await self.save_chat_message(text, sender_name)

        # If message is targeted to a specific peer channel (WebRTC offer/answer/candidate)
        if target_channel:
            await self.channel_layer.send(
                target_channel,
                {
                    'type': 'direct_peer_message',
                    'sender': sender_name,
                    'sender_channel': self.channel_name,
                    'payload': content
                }
            )
        else:
            # Broadcast to entire room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'meeting_message_broadcast',
                    'sender': sender_name,
                    'sender_channel': self.channel_name,
                    'payload': content
                }
            )

    @sync_to_async
    def save_chat_message(self, message_text, sender_name=None):
        try:
            from meetings.models import Meeting
            from chat.models import ChatMessage
            from accounts.middleware import get_or_create_default_user

            meeting = Meeting.objects.filter(meeting_code=self.meeting_code).first()
            if meeting:
                user = self.user if (self.user and self.user.is_authenticated) else get_or_create_default_user()
                ChatMessage.objects.create(
                    meeting=meeting,
                    sender=user,
                    message=message_text
                )
        except Exception as e:
            print(f"[SaveChatMessage Error] {e}")

    # Event handlers for group_send and direct messages
    async def user_joined_event(self, event):
        # Don't echo back to the joining sender
        if event.get('sender_channel') != self.channel_name:
            await self.send_json({
                'type': 'user_joined',
                'user': event['user'],
                'sender_channel': event.get('sender_channel')
            })

    async def user_left_event(self, event):
        if event.get('sender_channel') != self.channel_name:
            await self.send_json({
                'type': 'user_left',
                'user': event['user'],
                'sender_channel': event.get('sender_channel')
            })

    async def direct_peer_message(self, event):
        await self.send_json({
            'type': 'direct_message',
            'sender': event['sender'],
            'sender_channel': event['sender_channel'],
            'data': event['payload']
        })

    async def meeting_message_broadcast(self, event):
        # Forward broadcast payload to client (sender can choose to skip or receive)
        await self.send_json({
            'type': 'broadcast',
            'sender': event['sender'],
            'sender_channel': event['sender_channel'],
            'data': event['payload']
        })
