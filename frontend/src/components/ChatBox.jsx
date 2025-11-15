
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosclient';
import { useSocket } from '../hooks/useSocket';
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Avatar,
  Divider,
  ScrollShadow,
  Chip,
} from '@heroui/react';

const ChatBox = ({ emergencyId }) => {
  const currentUserId = useSelector((state) => state.auth.user?._id);
  const { socket, connected } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [emergency, setEmergency] = useState(null);
  const messagesEndRef = useRef(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socketJoined, setSocketJoined] = useState(false);
  const typingTimeoutRef = useRef(null);


  useEffect(() => {
    const fetchEmergencyDetails = async () => {
      try {
        const res = await axiosClient.get(`/emergencies/${emergencyId}`);
        setEmergency(res.data.data);
        
        const isCreator = res.data.data.createdBy?._id === currentUserId;
        const isResponder = res.data.data.responders?.some(
          (responder) => responder.userId?._id === currentUserId
        );
        
        setIsParticipant(isCreator || isResponder);
      } catch (err) {
        setError(err?.response?.data?.message || 'Error fetching emergency details');
      }
    };
    
    if (emergencyId && currentUserId) {
      fetchEmergencyDetails();
    }
  }, [emergencyId, currentUserId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/messages/${emergencyId}/messages`);
      setMessages(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err?.response?.data?.message || 'Error fetching messages');
      setLoading(false);
    }
  };

 
  useEffect(() => {
    if (!socket || !connected || !isParticipant) return;


    socket.emit('joinEmergencyRoom', { emergencyId });
    setSocketJoined(true);


    const handleJoinedRoom = (data) => {
      console.log('Joined emergency room:', data);
      setParticipants(data.participants || []);
      setLoading(false);
    };

    const handleChatHistory = (messages) => {
      setMessages(messages);
      setLoading(false);
    };

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      
     
      if (!showChat && message.sender._id !== currentUserId) {
        setUnreadCount(prev => prev + 1);
      }
      
    
      if (showChat && message.sender._id !== currentUserId) {
        socket.emit('markMessagesRead', {
          emergencyId,
          messageIds: [message._id]
        });
      }
    };

    const handleUserJoined = (data) => {
      setParticipants(prev => [...prev, data.user]);
    };

    const handleUserLeft = (data) => {
      setParticipants(prev => prev.filter(p => p._id !== data.user._id));
    };

    const handleTypingStatus = (data) => {
      setTypingUsers(data.users || []);
    };

    const handleMessageRead = (data) => {
    
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), data.readBy] }
          : msg
      ));
    };

    const handleError = (errorMessage) => {
      setError(errorMessage);
    };

  
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('chatHistory', handleChatHistory);
    socket.on('newMessage', handleNewMessage);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);
    socket.on('typingStatus', handleTypingStatus);
    socket.on('messageRead', handleMessageRead);
    socket.on('error', handleError);

    // Clean up event listeners
    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('chatHistory', handleChatHistory);
      socket.off('newMessage', handleNewMessage);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
      socket.off('typingStatus', handleTypingStatus);
      socket.off('messageRead', handleMessageRead);
      socket.off('error', handleError);
      
      if (socketJoined) {
        socket.emit('leaveEmergencyRoom', { emergencyId });
        setSocketJoined(false);
      }
    };
  }, [socket, connected, isParticipant, emergencyId, showChat, currentUserId, socketJoined]);

 
  useEffect(() => {
    if (isParticipant && (!socket || !connected)) {
      fetchMessages();
    }
  }, [isParticipant, socket, connected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!socket || !connected) return;
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', { emergencyId, isTyping: true });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', { emergencyId, isTyping: false });
      }
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    if (isTyping && socket && connected) {
      setIsTyping(false);
      socket.emit('typing', { emergencyId, isTyping: false });
    }
    
    try {
      setSending(true);
      
      if (socket && connected) {
        socket.emit('chatMessage', {
          emergencyId,
          message: messageContent
        });
      } else {
        const res = await axiosClient.post(`/messages/${emergencyId}/messages`, {
          message: messageContent 
        });
        
        setMessages(prev => [...prev, res.data.data]);
      }
    } catch (err) {
      setError('Error sending message');
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0);
      
     
      if (socket && connected) {
        const unreadMessageIds = messages
          .filter(msg => msg.sender._id !== currentUserId && !msg.readBy?.includes(currentUserId))
          .map(msg => msg._id);
        
        if (unreadMessageIds.length > 0) {
          socket.emit('markMessagesRead', {
            emergencyId,
            messageIds: unreadMessageIds
          });
        }
      }
    }
  };


  if (!isParticipant) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={toggleChat}
        className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg"
        isIconOnly
      >
        <div className="relative">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </Button>

      {/* Chat Window */}
      {showChat && (
        <div className="w-96 max-h-[500px] bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-purple-400/30 mt-2">
          <Card className="bg-transparent shadow-none border-none">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <h3 className="text-white font-semibold">Emergency Chat</h3>
                  <Chip size="sm" variant="flat" className="bg-purple-600/30 text-purple-200">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>

                 
                  </Chip>
                  {!connected && (
                    <Chip size="sm" color="warning" variant="flat">
                      online  Mode
                    </Chip>
                  )}
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={toggleChat}
                  className="text-white hover:bg-white/10"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <Divider className="bg-purple-400/30" />
            <CardBody className="px-4 py-2 overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-purple-300">Loading messages...</div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-2">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}
                  
                  <ScrollShadow className="h-64 w-full">
                    <div className="flex flex-col gap-2 p-1">
                      {messages.length === 0 ? (
                        <div className="text-center text-purple-300 py-8">
                          No messages yet. Start the conversation.
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.sender._id === currentUserId ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-2 ${
                                message.sender._id === currentUserId
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                  : 'bg-gradient-to-r from-indigo-600 to-blue-600'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar
                                  src={`https://i.pravatar.cc/150?u=${message.sender._id}`}
                                  size="sm"
                                />
                                <div>
                                  <div className="text-white text-xs font-semibold">
                                    {message.sender.name}
                                    {message.sender._id === emergency?.createdBy?._id && (
                                      <span className="ml-1 text-yellow-300">(Creator)</span>
                                    )}
                                    {emergency?.responders?.some(
                                      (r) => r.userId?._id === message.sender._id
                                    ) && (
                                      <span className="ml-1 text-green-300">(Responder)</span>
                                    )}
                                  </div>
                                  <div className="text-white/70 text-xs">
                                    {formatTime(message.createdAt)}
                                    {message.sender._id !== currentUserId && message.readBy?.includes(currentUserId) && (
                                      <span className="ml-1 text-green-300">✓✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-white text-sm break-words">
                                {message.message || message.content}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {typingUsers.length > 0 && (
                        <div className="text-purple-300 text-sm italic px-2">
                          {typingUsers.map(user => user.name).join(', ')} 
                          {typingUsers.length === 1 ? ' is' : ' are'} typing...
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollShadow>
                  
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      variant="flat"
                      size="sm"
                      className="flex-1"
                      classNames={{
                        input: "text-white",
                        inputWrapper: "bg-white/10 border-white/20"
                      }}
                    />
                    <Button
                      isIconOnly
                      color="secondary"
                      size="sm"
                      onClick={handleSendMessage}
                      isLoading={sending}
                      isDisabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChatBox;