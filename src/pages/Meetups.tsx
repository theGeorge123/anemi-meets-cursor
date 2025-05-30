import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface Meetup {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  status: 'upcoming' | 'past';
}

const MeetupListItem = React.memo(function MeetupListItem({ meetup, onView, onJoin }: { meetup: Meetup, onView: (id: string) => void, onJoin: (id: string) => void }) {
  return (
    <div
      className="card hover:shadow-lg transition-shadow duration-300"
      key={meetup.id}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1">
          <h2 className="mobile-heading text-[#37474f] mb-2">{meetup.title}</h2>
          <p className="mobile-text text-gray-600 mb-4 line-clamp-2">{meetup.description}</p>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="mobile-text">{new Date(meetup.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="mobile-text">{meetup.time}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn-primary flex-1" onClick={() => onView(meetup.id)}>Bekijk</button>
          <button className="btn-secondary flex-1" onClick={() => onJoin(meetup.id)}>Deelnemen</button>
        </div>
      </div>
    </div>
  );
});

const Meetups: React.FC = () => {
  const navigate = useNavigate();
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // TODO: Fetch meetups from API
    const mockMeetups: Meetup[] = [
      {
        id: '1',
        title: 'Coffee & Code',
        description: 'Join us for a casual coding session over coffee. Bring your laptop and your favorite coffee!',
        date: '2024-04-15',
        time: '10:00 AM',
        location: 'Downtown Coffee Shop',
        status: 'upcoming'
      },
      {
        id: '2',
        title: 'Web Development Workshop',
        description: 'Learn the basics of web development with React and TypeScript.',
        date: '2024-04-20',
        time: '2:00 PM',
        location: 'Tech Hub',
        status: 'upcoming'
      }
    ];
    setMeetups(mockMeetups);
  }, []);

  const filteredMeetups = useMemo(() => {
    return meetups.filter(meetup => {
      const matchesSearch = meetup.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || meetup.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [meetups, searchQuery, filterStatus]);

  const handleViewMeetup = useCallback((id: string) => {
    navigate(`/meetup/${id}`);
  }, [navigate]);

  const handleJoinMeetup = useCallback((id: string) => {
    // TODO: Implement join meetup functionality
    console.log('Joining meetup:', id);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="mobile-heading text-[#37474f]">Meetups</h1>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search meetups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full sm:w-64"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full sm:w-48"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMeetups.map(meetup => (
            <MeetupListItem key={meetup.id} meetup={meetup} onView={handleViewMeetup} onJoin={handleJoinMeetup} />
          ))}
        </div>

        {filteredMeetups.length === 0 && (
          <div className="text-center py-12">
            <p className="mobile-text text-gray-600">No meetups found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meetups; 