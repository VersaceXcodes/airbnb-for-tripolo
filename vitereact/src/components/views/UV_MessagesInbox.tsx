import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

interface MessageThread {
  thread_id: string;
  property_id: string | null;
  guest_id: string;
  host_id: string;
  last_message_at: string | null;
  other_party_name: string;
  other_party_image: string;
  unread_count: number;
}

const UV_MessagesInbox: React.FC = () => {
  // Zustand store access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const setActiveThread = useAppStore(state => state.set_active_thread);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredThreads, setFilteredThreads] = useState<MessageThread[]>([]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;
  
  // Fetch message threads
  const fetchMessageThreads = async () => {
    if (!authToken) throw new Error('No auth token');
    
    const response = await axios.get(`${API_BASE_URL}/messages/threads`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      params: {
        limit: 100,
        offset: 0
      }
    });
    
    // Transform response to include participant info
    const threads: MessageThread[] = response.data.threads.map((thread: any) => ({
      thread_id: thread.thread_id,
      property_id: thread.property_id,
      guest_id: thread.guest_id,
      host_id: thread.host_id,
      last_message_at: thread.last_message_at,
      other_party_name: 'Loading...', // Will be updated with participant data
      other_party_image: 'https://placehold.co/40x40/3b82f6/white?text=?',
      unread_count: 0 // TODO: Calculate from messages
    }));
    
    return threads;
  };
  
  // Mark thread as read
  const markThreadAsRead = async (threadId: string) => {
    if (!authToken) throw new Error('No auth token');
    
    await axios.patch(`${API_BASE_URL}/messages/threads/${threadId}`, {}, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    
    // Update local cache
    queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
  };
  
  // Query for message threads
  const { data: threads = [], isLoading, isError, error } = useQuery({
    queryKey: ['messageThreads'],
    queryFn: fetchMessageThreads,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!authToken
  });
  
  // Filter threads based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredThreads(threads);
      return;
    }
    
    const filtered = threads.filter(thread => 
      thread.thread_id.includes(searchQuery) ||
      thread.other_party_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredThreads(filtered);
  }, [searchQuery, threads]);
  
  // Handle thread click
  const handleThreadClick = (threadId: string) => {
    setActiveThread(threadId);
    markThreadAsRead(threadId);
    navigate(`/messages/${threadId}`);
  };
  
  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar */}
              <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow p-4 h-full">
                <div className="animate-pulse">
                  <div className="h-10 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded hover:bg-gray-50">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-10"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-red-400" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading messages</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['messageThreads'] })}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="mt-1 text-gray-600">Your conversations with hosts and guests</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar - Thread List */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow p-4 h-full md:h-[calc(100vh-180px)] flex flex-col">
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                {filteredThreads.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No conversations</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery ? 'No conversations match your search' : 'Start a conversation with a host or guest'}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {filteredThreads.map((thread) => (
                      <li key={thread.thread_id}>
                        <button
                          onClick={() => handleThreadClick(thread.thread_id)}
                          className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <img 
                              className="h-10 w-10 rounded-full" 
                              src={thread.other_party_image} 
                              alt={thread.other_party_name} 
                            />
                            {thread.unread_count > 0 && (
                              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {thread.other_party_name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatDate(thread.last_message_at)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              Last message preview...
                            </p>
                          </div>
                          {thread.unread_count > 0 && (
                            <div className="flex-shrink-0">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-xs font-medium text-white">
                                {thread.unread_count}
                              </span>
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Main Content - Empty State */}
            <div className="flex-1 bg-white rounded-lg shadow p-6 flex items-center justify-center">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a conversation from the list to start messaging
                </p>
                <div className="mt-6">
                  <Link
                    to="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Listings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_MessagesInbox;