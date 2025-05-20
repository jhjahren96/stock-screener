import React, { useState } from 'react';
import { TextField } from '@mui/material';

export default function TestInput() {
  const [value, setValue] = useState('');
  return (
    <TextField
      label="Test"
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
