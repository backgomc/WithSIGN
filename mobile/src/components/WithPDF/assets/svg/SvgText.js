import React from 'react';

const SvgText = props => (
  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" {...props}>
    <path d="M0 0v2h.5c0-.55.45-1 1-1h1.5v5.5c0 .28-.22.5-.5.5h-.5v1h4v-1h-.5c-.28 0-.5-.22-.5-.5v-5.5h1.5c.55 0 1 .45 1 1h.5v-2h-8z" />
  </svg>
);

export default SvgText;