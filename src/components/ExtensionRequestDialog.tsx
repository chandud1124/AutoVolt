import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { classExtensionAPI } from '@/services/api';
import { Clock, Calendar } from 'lucide-react';

const extensionSchema = z.object({
  requestedEndTime: z.string().min(1, 'End time is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  additionalNotes: z.string().optional(),
});

type ExtensionFormData = z.infer<typeof extensionSchema>;

interface ExtensionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: {
    id: string;
    name: string;
    time: string;
  } | null;
}

export const ExtensionRequestDialog: React.FC<ExtensionRequestDialogProps> = ({
  open,
  onOpenChange,
  schedule,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExtensionFormData>({
    resolver: zodResolver(extensionSchema),
  });

  const onSubmit = async (data: ExtensionFormData) => {
    if (!schedule) return;

    setIsSubmitting(true);
    try {
      // Convert time (HH:mm) to full datetime for today
      const now = new Date();
      const [hours, minutes] = data.requestedEndTime.split(':');
      const requestedDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parseInt(hours, 10),
        parseInt(minutes, 10)
      );

      await classExtensionAPI.createRequest({
        scheduleId: schedule.id,
        requestedEndTime: requestedDateTime.toISOString(),
        reason: data.reason,
        additionalNotes: data.additionalNotes,
      });

      toast({
        title: 'Extension Request Submitted',
        description: 'Your extension request has been sent to the approvers.',
      });

      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit extension request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Request Extension - {schedule.name}
          </DialogTitle>
          <DialogDescription>
            Request to extend the scheduled automation time for this device schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requestedEndTime">Requested End Time</Label>
            <Input
              id="requestedEndTime"
              type="time"
              {...register('requestedEndTime')}
              className={errors.requestedEndTime ? 'border-red-500' : ''}
            />
            {errors.requestedEndTime && (
              <p className="text-sm text-red-500">{errors.requestedEndTime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extension *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need this extension..."
              {...register('reason')}
              className={errors.reason ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any additional information..."
              {...register('additionalNotes')}
              rows={2}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <Calendar className="w-4 h-4" />
              <span>
                Current schedule ends at: <strong>{schedule.time}</strong>
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};