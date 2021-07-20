import React, { useState } from 'react';
import { Link, navigate } from '@reach/router';
import { Box, Button, Toast, Container, TextField, Heading } from 'gestalt';
import 'gestalt/dist/gestalt.css';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [emailHasBeenSent, setEmailHasBeenSent] = useState(false);
  const [error, setError] = useState(null);

  return (
    <div>
    </div>
  );
};
export default PasswordReset;
