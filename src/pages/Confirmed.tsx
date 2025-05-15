import React from 'react';

const Confirmed = () => (
  <div className="max-w-2xl mx-auto text-center py-16">
    <h1 className="text-3xl font-bold text-primary-600 mb-4">
      Gefeliciteerd, jullie komen een stap dichter bij elkaar!
    </h1>
    <p className="text-lg text-gray-700 mb-8">
      Je reactie is verstuurd. Veel plezier met jullie koffie-afspraak!
    </p>
    <img
      src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2J6d2J6d3F2d3F2d3F2d3F2d3F2d3F2d3F2d3F2d3F2d3F2/g9582DNuQppxC/giphy.gif"
      alt="Confetti"
      className="mx-auto rounded-xl shadow-lg mb-6"
      style={{ maxWidth: 320 }}
    />
    <div className="text-gray-500">Je ontvangt binnenkort een bevestiging per e-mail.</div>
  </div>
);

export default Confirmed; 