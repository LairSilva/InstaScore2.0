import { renderToString } from 'react-dom/server';
import React from 'react';
import App from './dist/server.cjs'; // Wait, dist/server.cjs is the Express server, not the React App.
