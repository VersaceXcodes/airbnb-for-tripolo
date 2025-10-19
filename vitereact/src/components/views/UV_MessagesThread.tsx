import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAppStore } from '@/store/main';

interface Message {
  message_id: string;
  thread_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface User {
  user_id: string;
  email: string;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
}

const UV_MessagesThread: React.FC = () => {
  const { thread_id } = useParams<{ thread_id: string }>();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local state
  const [newMessageContent, setNewMessageContent] = useState('');
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch thread messages
  const fetchThreadMessages = async (): Promise<Message[]> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/messages/threads/${thread_id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          limit: 50,
          offset: 0,
        },
      }
    );
    return response.data.messages;
  };
  
  const {
    data: messages = [],
    isLoading: messagesLoading,
    isError: messagesError,
  } = useQuery({
    queryKey: ['threadMessages', thread_id],
    queryFn: fetchThreadMessages,
    enabled: !!thread_id && !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  // Fetch participant details
  const fetchParticipant = async (userId: string): Promise<User> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  };
  
  // Determine participant IDs (excluding current user)
  const participantIds = Array.from(
    new Set(
      messages
        .flatMap(msg => [msg.sender_id, msg.recipient_id])
        .filter(id => id !== currentUser?.user_id)
    )
  );
  
  const {
    data: participants = [],
    isLoading: participantsLoading,
  } = useQuery({
    queryKey: ['threadParticipants', participantIds],
    queryFn: async () => {
      if (participantIds.length === 0) return [];
      return Promise.all(participantIds.map(id => fetchParticipant(id)));
    },
    enabled: participantIds.length > 0 && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Send message mutation
  const sendMessage = async (messageData: {
    thread_id: string;
    content: string;
    sender_id: string;
    recipient_id: string;
  }) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/messages`,
      messageData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  };
  
  const {
    mutate: sendNewMessage,
    isPending: isSending,
    isError: sendError,
  } = useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Add the new message to the query cache
      queryClient.setQueryData<Message[]>(
        ['threadMessages', thread_id],
        (oldMessages = []) => [...oldMessages, newMessage]
      );
      // Clear input
      setNewMessageContent('');
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
  
  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessageContent.trim() || !thread_id || !currentUser) return;
    
    // Determine recipient (first participant that's not the current user)
    const recipient = participants.find(p => p.user_id !== currentUser.user_id);
    if (!recipient) return;
    
    sendNewMessage({
      thread_id,
      content: newMessageContent,
      sender_id: currentUser.user_id,
      recipient_id: recipient.user_id,
    });
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Get participant name for display
  const getParticipantName = () => {
    if (participants.length > 0) {
      const participant = participants[0];
      return participant.full_name || participant.username;
    }
    return 'مستخدم';
  };
  
  // Format message timestamp
  const formatMessageTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a', { locale: ar });
  };
  
  // Format message date
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'اليوم';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'أمس';
    } else {
      return format(date, 'd MMM yyyy', { locale: ar });
    }
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const grouped: Record<string, Message[]> = {};
    
    messages.forEach(message => {
      const dateKey = formatMessageDate(message.created_at);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });
    
    return grouped;
  };
  
  const groupedMessages = groupMessagesByDate();
  
  // Loading state
  if (messagesLoading || participantsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Error state
  if (messagesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ</h3>
          <p className="text-gray-600 mb-4">تعذر تحميل رسائل المحادثة</p>
          <Link 
            to="/messages"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            العودة إلى الرسائل
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Link 
                to="/messages"
                className="text-gray-500 hover:text-gray-700 ml-4"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center mr-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {participants[0]?.profile_image_url ? (
                      <img 
                        src={participants[0].profile_image_url} 
                        alt={getParticipantName()} 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {getParticipantName().charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mr-3">
                  <h1 className="text-lg font-semibold text-gray-900">{getParticipantName()}</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date} className="mb-6">
                <div className="flex justify-center">
                  <div className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
                    {date}
                  </div>
                </div>
                
                {dateMessages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUser?.user_id;
                  const sender = participants.find(p => p.user_id === message.sender_id) || 
                                (message.sender_id === currentUser?.user_id ? currentUser : null);
                  
                  return (
                    <div 
                      key={message.message_id} 
                      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isCurrentUser && (
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            {sender?.profile_image_url ? (
                              <img 
                                src={sender.profile_image_url} 
                                alt={sender.full_name || sender.username} 
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 text-xs">
                                {(sender?.full_name || sender?.username || 'U').charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl ${isCurrentUser ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl' : 'bg-white text-gray-800 rounded-r-2xl rounded-tl-2xl'} rounded-br-2xl px-4 py-2 shadow-sm`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} text-left`}>
                          {formatMessageTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Message input */}
        <div className="bg-white border-t border-gray-200 fixed bottom-0 w-full">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSendMessage} className="flex">
              <div className="flex-1 mr-3">
                <textarea
                  value={newMessageContent}
                  onChange={(e) => setNewMessageContent(e.target.value)}
                  placeholder="اكتب رسالة..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={1}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                  }}
                />
              </div>
              <div className="flex items-center">
                <button
                  type="submit"
                  disabled={!newMessageContent.trim() || isSending}
                  className={`flex items-center justify-center h-12 w-12 rounded-full ${!newMessageContent.trim() || isSending ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSending ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
            
            {sendError && (
              <div className="mt-2 text-red-600 text-sm text-center">
                فشل في إرسال الرسالة. حاول مرة أخرى.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_MessagesThread;