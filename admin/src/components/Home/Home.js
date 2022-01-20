import React, { useEffect } from 'react';

const Home = () => {
  useEffect(() => {
    return () => {} // cleanup
  }, []);

  return (
    <div>
        Home
    </div>
  );
};

export default Home;
