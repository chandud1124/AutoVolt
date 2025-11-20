import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { telegramAPI } from '@/services/api';
import { Loader2, Bot, Users, Settings, BarChart3, Send, UserMinus, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface TelegramUser {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  username?: string;
  createdAt: string;
  lastInteraction?: string;
  isActive: boolean;
  isVerified: boolean;
}

interface BotInfo {
  botUsername: string;
  botName: string;
  webhookUrl?: string;
  isWebhookSet: boolean;
  totalUsers: number;
  activeUsers: number;
}

interface BotStats {
  totalMessages: number;
  totalAlerts: number;
  totalUsers: number;
  activeUsers: number;
  messagesToday: number;
  alertsToday: number;
}

export default function TelegramBotPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [botInfoRes, statsRes, usersRes] = await Promise.all([
        telegramAPI.getBotInfo(),
        telegramAPI.getStats(),
        telegramAPI.getUsers()
      ]);

      setBotInfo(botInfoRes.data);
      setBotStats(statsRes.data);
      setTelegramUsers(usersRes.data);
      setWebhookUrl(botInfoRes.data.webhookUrl || '');
    } catch (error) {
      console.error('Failed to load Telegram bot data:', error);
      toast.error('Failed to load Telegram bot data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWebhook = async () => {
    try {
      await telegramAPI.registerWebhook(webhookUrl || undefined);
      toast.success('Webhook registered successfully');
      loadData();
    } catch (error) {
      console.error('Failed to register webhook:', error);
      toast.error('Failed to register webhook');
    }
  };

  const handleSendTestAlert = async () => {
    try {
      await telegramAPI.sendTestAlert(testMessage || undefined);
      toast.success('Test alert sent successfully');
      setTestMessage('');
    } catch (error) {
      console.error('Failed to send test alert:', error);
      toast.error('Failed to send test alert');
    }
  };

  const handleUnregisterUser = async (userId: string) => {
    try {
      await telegramAPI.unregisterUser(userId);
      toast.success('User unregistered from Telegram notifications');
      loadData();
    } catch (error) {
      console.error('Failed to unregister user:', error);
      toast.error('Failed to unregister user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Telegram Bot Management</h1>
          <p className="text-muted-foreground">
            Configure and manage your Telegram bot for notifications and alerts
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {botInfo && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Bot Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Bot Name</Label>
                    <p className="text-sm text-muted-foreground">{botInfo.botName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Bot Username</Label>
                    <p className="text-sm text-muted-foreground">@{botInfo.botUsername}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Webhook Status</Label>
                    <div className="flex items-center gap-2">
                      {botInfo.isWebhookSet ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {botInfo.isWebhookSet ? 'Configured' : 'Not Configured'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Users</span>
                    <Badge variant="secondary">{botInfo.totalUsers}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Users</span>
                    <Badge variant="secondary">{botInfo.activeUsers}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Test Bot Functionality</CardTitle>
              <CardDescription>
                Send a test message to verify your bot is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-message">Test Message</Label>
                <Textarea
                  id="test-message"
                  placeholder="Enter a test message..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
              <Button onClick={handleSendTestAlert} disabled={!testMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send Test Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Registered Users</h3>
              <p className="text-sm text-muted-foreground">
                Users who have registered for Telegram notifications
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Telegram Username</TableHead>
                    <TableHead>Registered At</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {telegramUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        {user.user.name}
                      </TableCell>
                      <TableCell>{user.username || 'Not set'}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {user.lastInteraction ? new Date(user.lastInteraction).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnregisterUser(user.user._id)}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unregister
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure the webhook URL for receiving Telegram updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-domain.com/api/telegram/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleRegisterWebhook}>
                Register Webhook
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <AlertDescription>
              The webhook URL should be publicly accessible and point to your backend's Telegram webhook endpoint.
              Make sure your server can receive POST requests from Telegram's servers.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {botStats && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{botStats.totalMessages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{botStats.totalAlerts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{botStats.messagesToday}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{botStats.alertsToday}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {botStats && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Total Registered Users</Label>
                    <p className="text-2xl font-bold">{botStats.totalUsers}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Active Users</Label>
                    <p className="text-2xl font-bold">{botStats.activeUsers}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}