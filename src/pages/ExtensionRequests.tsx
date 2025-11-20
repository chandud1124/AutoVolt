import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { classExtensionAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar, User } from 'lucide-react';
import type { ClassExtensionRequest, ExtensionProcessData } from '@/types';

const ExtensionRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ClassExtensionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDialog, setProcessingDialog] = useState<{
    open: boolean;
    request: ClassExtensionRequest | null;
    action: 'approve' | 'reject' | null;
  }>({ open: false, request: null, action: null });
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await classExtensionAPI.getAllRequests();
      setRequests(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch extension requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcessRequest = async () => {
    if (!processingDialog.request || !processingDialog.action) return;

    setIsProcessing(true);
    try {
      await classExtensionAPI.processRequest(processingDialog.request.id, {
        action: processingDialog.action,
        comments: comments.trim() || undefined,
      });

      toast({
        title: 'Request Processed',
        description: `Extension request has been ${processingDialog.action}d.`,
      });

      setProcessingDialog({ open: false, request: null, action: null });
      setComments('');
      fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading extension requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Extension Requests</h1>
          <p className="text-muted-foreground">
            Manage class extension requests from faculty and teachers
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  No pending extension requests to review.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {request.scheduleName || 'Schedule Extension Request'}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {request.requestedBy.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Original End Time</Label>
                          <p className="text-sm text-muted-foreground">{request.originalEndTime}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Requested End Time</Label>
                          <p className="text-sm">{request.requestedEndTime}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Reason</Label>
                        <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                      </div>

                      {request.additionalNotes && (
                        <div>
                          <Label className="text-sm font-medium">Additional Notes</Label>
                          <p className="text-sm text-muted-foreground mt-1">{request.additionalNotes}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setProcessingDialog({
                            open: true,
                            request,
                            action: 'approve'
                          })}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setProcessingDialog({
                            open: true,
                            request,
                            action: 'reject'
                          })}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No processed requests</h3>
                <p className="text-muted-foreground">
                  Processed extension requests will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {processedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {request.scheduleName || 'Schedule Extension Request'}
                      </CardTitle>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {request.requestedBy.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </div>
                      {request.processedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Processed: {new Date(request.processedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Original End Time</Label>
                          <p className="text-sm text-muted-foreground">{request.originalEndTime}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Requested End Time</Label>
                          <p className="text-sm">{request.requestedEndTime}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Reason</Label>
                        <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                      </div>

                      {request.additionalNotes && (
                        <div>
                          <Label className="text-sm font-medium">Additional Notes</Label>
                          <p className="text-sm text-muted-foreground mt-1">{request.additionalNotes}</p>
                        </div>
                      )}

                      {request.processedBy && (
                        <div>
                          <Label className="text-sm font-medium">Processed By</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.processedBy.name} ({request.processedBy.role})
                          </p>
                        </div>
                      )}

                      {request.comments.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Comments</Label>
                          <div className="space-y-2 mt-1">
                            {request.comments.map((comment, index) => (
                              <div key={index} className="bg-muted p-3 rounded-md">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <MessageSquare className="w-3 h-3" />
                                  {comment.commentedBy.name} - {new Date(comment.commentedAt).toLocaleString()}
                                </div>
                                <p className="text-sm">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={processingDialog.open} onOpenChange={(open) =>
        setProcessingDialog({ open, request: null, action: null })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processingDialog.action === 'approve' ? 'Approve' : 'Reject'} Extension Request
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments for this decision..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProcessingDialog({ open: false, request: null, action: null })}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessRequest}
              disabled={isProcessing}
              variant={processingDialog.action === 'approve' ? 'default' : 'destructive'}
            >
              {isProcessing ? 'Processing...' :
               processingDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtensionRequests;