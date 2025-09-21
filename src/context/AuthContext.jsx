import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  register: () => {},
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Error parsing stored user:", err);
      localStorage.removeItem('user');
    }
  }, []);

  const register = (userData) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || "[]");

      if (users.find(u => u.email === userData.email)) {
        return { error: 'User already exists' };
      }

      const newUser = {
        ...userData,
        createdAt: new Date().toISOString()
      };

      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (err) {
      console.error("Error during registration:", err);
      return { error: 'Registration failed' };
    }
  };

 // AuthContext.jsx
const login = (email, password) => {
  try {
    // Hardcode admin credentials
    if (email === 'admin@gmail.com' && password === 'admin') {
      const adminUser = {
        email: 'admin@gmail.com',
        role: 'admin',
        name: 'Administrator'
      };
      localStorage.setItem('user', JSON.stringify(adminUser));
      setUser(adminUser);
      return { success: true, user: adminUser };
    }

    const users = JSON.parse(localStorage.getItem('users') || []);
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
      return { error: 'Invalid credentials' };
    }

    localStorage.setItem('user', JSON.stringify(foundUser));
    setUser(foundUser);
    return { success: true, user: foundUser };
  } catch (err) {
    console.error("Error during login:", err);
    return { error: 'Login failed' };
  }
};

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
