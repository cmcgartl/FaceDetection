// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client'; // 👈 use 'react-dom/client' instead
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store';

// Create a root and render the app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
           