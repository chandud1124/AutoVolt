import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Clock, TrendingUp, Lightbulb, AlertCircle, 
  CheckCircle, RefreshCw, Loader2, Zap, BarChart3 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface SmartSchedulerTabProps {
  devices: any[];
  currentDevice: any;
  setDevice: (deviceId: string) => void;
}

const SmartSchedulerTab: React.FC<SmartSchedulerTabProps> = ({ 
  devices, 
  currentDevice, 
  setDevice 
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedSwitch, setSelectedSwitch] = useState<string>('all');
  const { toast } = useToast();

  // Fetch analysis when device or switch changes
  useEffect(() => {
    if (currentDevice) {
      fetchAnalysis();
    }
  }, [currentDevice, selectedSwitch]);

  const fetchAnalysis = async () => {
    if (!currentDevice) return;

    try {
      setLoading(true);
      const switchParam = selectedSwitch !== 'all' ? `?switchId=${selectedSwitch}` : '';
      const response = await apiService.get(
        `/smart-schedule/${currentDevice.id}/analyze${switchParam}`
      );

      if (response.data.success) {
        setAnalysis(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to analyze schedule');
      }
    } catch (error: any) {
      console.error('Smart schedule analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.response?.data?.message || error.message || 'Failed to fetch smart schedule analysis',
        variant: 'destructive'
      });
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  // Get available switches for current device
  const availableSwitches = currentDevice?.switches || [];

  if (!currentDevice) {
    return (
      <div className='flex flex-col items-center justify-center py-16 px-4'>
        <Calendar className='w-16 h-16 text-muted-foreground/40 mb-4' />
        <h3 className='text-lg font-semibold text-foreground mb-2'>No Device Selected</h3>
        <p className='text-sm text-muted-foreground text-center max-w-md'>
          Select a device to analyze usage patterns and generate smart schedules
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='w-8 h-8 animate-spin text-primary' />
        <span className='ml-2'>Analyzing usage patterns...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className='text-center py-12'>
        <div className='flex flex-col items-center justify-center'>
          <BarChart3 className='w-16 h-16 text-muted-foreground/40 mb-4' />
          <h3 className='text-lg font-semibold text-foreground mb-2'>No Analysis Available</h3>
          <p className='text-sm text-muted-foreground mb-4'>
            Click the button below to analyze usage patterns
          </p>
          <Button onClick={fetchAnalysis}>
            <RefreshCw className='w-4 h-4 mr-2' />
            Analyze Now
          </Button>
        </div>
      </div>
    );
  }

  // Handle insufficient data case
  if (analysis.status === 'insufficient_data' || analysis.status === 'no_data') {
    return (
      <div className='space-y-4'>
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            {analysis.message || 'Not enough historical data to generate predictions. The system needs at least 7 days of switch operation history.'}
          </AlertDescription>
        </Alert>

        {analysis.data_points !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle>Data Collection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Data Points Collected:</span>
                  <span className='font-semibold'>{analysis.data_points}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Minimum Required:</span>
                  <span className='font-semibold'>7</span>
                </div>
                <div className='w-full bg-muted rounded-full h-2 mt-2'>
                  <div 
                    className='bg-primary h-2 rounded-full transition-all' 
                    style={{ width: `${Math.min(100, (analysis.data_points / 7) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={fetchAnalysis} className='w-full'>
          <RefreshCw className='w-4 h-4 mr-2' />
          Check Again
        </Button>
      </div>
    );
  }

  // Prepare data for visualizations
  const scheduleData = analysis.smart_schedule || {};
  const patterns = analysis.patterns || {};
  const predictions = analysis.predictions || {};
  const confidence = analysis.confidence || {};
  const recommendations = analysis.recommendations || [];

  // Usage by day of week chart data
  const usageByDayData = patterns.usage_by_day ? 
    Object.entries(patterns.usage_by_day).map(([day, count]) => ({
      day: day.substring(0, 3),
      operations: count
    })) : [];

  // Confidence radar chart data
  const confidenceData = [
    { metric: 'Overall', value: (confidence.overall || 0) * 100 },
    { metric: 'Weekday ON', value: (confidence.weekday_on || 0) * 100 },
    { metric: 'Weekday OFF', value: (confidence.weekday_off || 0) * 100 },
    { metric: 'Weekend ON', value: (confidence.weekend_on || 0) * 100 },
    { metric: 'Weekend OFF', value: (confidence.weekend_off || 0) * 100 }
  ];

  return (
    <div className='space-y-6'>
      {/* Header Controls */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Smart Scheduler</h2>
          <p className='text-sm text-muted-foreground'>
            AI-powered predictions for optimal switch scheduling
          </p>
        </div>
        <div className='flex gap-2'>
          {availableSwitches.length > 0 && (
            <Select value={selectedSwitch} onValueChange={setSelectedSwitch}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select switch' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Switches</SelectItem>
                {availableSwitches.map((sw: any) => (
                  <SelectItem key={sw.id} value={sw.id}>
                    {sw.name || `Switch ${sw.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={fetchAnalysis} variant='outline' size='icon'>
            <RefreshCw className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {/* Analysis Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Confidence Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {Math.round((confidence.overall || 0) * 100)}%
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Prediction reliability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Data Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {analysis.analysis?.total_events || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Switch operations analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {analysis.analysis?.date_range?.days || 0}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Days of history
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Avg Daily Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {patterns.average_daily_hours?.mean?.toFixed(1) || '0.0'}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Hours ON per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Lightbulb className='w-5 h-5 text-yellow-500' />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Smart insights based on usage pattern analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {recommendations.map((rec: string, index: number) => (
                <div key={index} className='flex items-start gap-2 p-3 bg-muted/30 rounded-lg'>
                  <CheckCircle className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Patterns */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Usage by Day */}
        {usageByDayData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Calendar className='w-5 h-5' />
                Usage by Day of Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='h-64 w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={usageByDayData}>
                    <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' opacity={0.3} />
                    <XAxis dataKey='day' />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey='operations' fill='#3b82f6' radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confidence Radar */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5' />
              Prediction Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='h-64 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart data={confidenceData}>
                  <PolarGrid stroke='hsl(var(--border))' />
                  <PolarAngleAxis dataKey='metric' />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name='Confidence' 
                    dataKey='value' 
                    stroke='#8b5cf6' 
                    fill='#8b5cf6' 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='w-5 h-5' />
            Predicted Schedule
          </CardTitle>
          <CardDescription>
            Recommended ON/OFF times based on historical patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {Object.entries(scheduleData).map(([day, schedule]: [string, any]) => (
              <div key={day} className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                <div className='flex items-center gap-3 flex-1'>
                  <div className='w-24 font-medium text-sm capitalize'>{day}</div>
                  <div className='text-sm text-muted-foreground'>
                    {schedule.status === 'insufficient_confidence' ? (
                      <span>Collecting data...</span>
                    ) : (
                      <span>
                        ON: {schedule.predicted_on || 'N/A'} | OFF: {schedule.predicted_off || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={
                    schedule.confidence >= 80 ? 'default' :
                    schedule.confidence >= 60 ? 'secondary' : 'outline'
                  }
                >
                  {schedule.confidence ? `${schedule.confidence}%` : 'Low'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartSchedulerTab;
