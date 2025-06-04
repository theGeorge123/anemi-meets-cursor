import React from 'react';

// Mock data for cafes
const cafes = [
  {
    id: '1',
    name: 'Café de Koffiehoek',
    address: 'Koffiestraat 1, Rotterdam',
    image_url: 'https://source.unsplash.com/400x200/?coffee,rotterdam',
    description: 'Gezellig café met de beste koffie van de stad.'
  },
  {
    id: '2',
    name: 'Espresso Express',
    address: 'Stationsplein 10, Rotterdam',
    image_url: 'https://source.unsplash.com/400x200/?espresso,bar',
    description: 'Snelle espresso en heerlijke gebakjes.'
  },
  {
    id: '3',
    name: 'Latte Lounge',
    address: 'Loungetuin 5, Rotterdam',
    image_url: 'https://source.unsplash.com/400x200/?latte,cafe',
    description: 'Ontspan met een latte in onze lounge.'
  }
];

const Explore: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-700 mb-8 text-center">Explore Cafés</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cafes.map(cafe => (
          <div key={cafe.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col">
            <img src={cafe.image_url} alt={cafe.name} className="rounded-lg mb-4 h-40 object-cover" />
            <h2 className="text-lg font-semibold text-primary-700 mb-1">{cafe.name}</h2>
            <p className="text-gray-600 mb-2">{cafe.address}</p>
            <p className="text-base text-gray-700 mb-4 line-clamp-2">{cafe.description}</p>
            <button className="btn-primary mt-auto">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore; 