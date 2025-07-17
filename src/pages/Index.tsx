import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const features = [
    {
      icon: MessageCircle,
      title: 'Real-time Messaging',
      description: 'Send and receive messages instantly with Socket.io technology'
    },
    {
      icon: Users,
      title: 'Multiple Rooms',
      description: 'Join different chat rooms and connect with various communities'
    },
    {
      icon: Zap,
      title: 'Live Typing Indicators',
      description: 'See when others are typing and stay engaged in conversations'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Your conversations are protected with modern security practices'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">WolaChat</span>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Connect & Chat in Real-Time
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience seamless communication with WolaChat - a modern, fast, and reliable 
            real-time messaging platform built for the future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="h-12 px-8"
              onClick={() => navigate('/register')}
            >
              Start Chatting Now
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-8"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Section */}
        <div className="text-center bg-card rounded-xl p-8 border">
          <h2 className="text-3xl font-bold mb-4">Try it out!</h2>
          <p className="text-muted-foreground mb-6">
            Get started instantly with our demo account
          </p>
          <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-2">Demo credentials:</p>
            <p className="font-mono text-sm">
              <span className="text-primary">username:</span> demo • <span className="text-primary">password:</span> demo
            </p>
          </div>
          <Button onClick={() => navigate('/login')}>
            Try Demo
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 WolaChat. Built with React, Socket.io, and modern web technologies.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
