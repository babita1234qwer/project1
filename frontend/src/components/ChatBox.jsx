import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Button, Input, Card, CardBody, CardHeader, Divider, Avatar } from '@heroui/react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosclient';

const ChatBox = ({ emergencyId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(  'http://localhost:3001');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server!');
      // Join the emergency room
      socketRef.current.emit('joinEmergencyRoom', { emergencyId, userId: user._id });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server.');
    });

    // Listen for incoming messages
    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for chat history
    socketRef.current.on('chatHistory', (history) => {
      setMessages(history);
    });

    // Listen for errors from the server
    socketRef.current.on('error', (errorMessage) => {
      console.error('Socket error:', errorMessage);
      alert(errorMessage);
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, [emergencyId, user._id]);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {
      socketRef.current.emit('chatMessage', {
        emergencyId,
        userId: user._id,
        message: newMessage,
      });
      setNewMessage('');
    }
  };

  return (
    <Card className="mt-4" style={{ height: '400px' }}>
      <CardHeader>Emergency Chat</CardHeader>
      <Divider />
      <CardBody className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
        <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex gap-2 ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender._id !== user._id && (
                <Avatar size="sm" name={msg.sender.name} src="" />
              )}
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  msg.sender._id === user._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="font-semibold text-xs">{msg.sender.name}</p>
                <p>{msg.message}</p>
              </div>
              {msg.sender._id === user._id && (
                <Avatar size="sm" name={msg.sender.name} src="" />
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <Divider className="my-2" />
        <div className="flex gap-2">
          <Input
            size="sm"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            isDisabled={false}
          />
          <Button size="sm" color="primary" isDisabled={false} onClick={handleSendMessage}>
            Send
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};

export default ChatBox;