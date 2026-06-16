import { Router, Request, Response } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import { prisma } from 'database';

const router = Router();

// The Clerk webhook requires the raw body for signature verification.
// We use express.raw({ type: 'application/json' }) specifically for this route.
router.post('/clerk', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET in environment variables');
    res.status(500).json({ error: 'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env' });
    return;
  }

  // Get the headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  // If there are no Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({ error: 'Error occurred -- no svix headers' });
    return;
  }

  // Get the body
  const payload = req.body.toString();
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    res.status(400).json({ error: 'Error verifying webhook' });
    return;
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  if (eventType === 'user.created') {
    const email = evt.data.email_addresses?.[0]?.email_address || '';
    const name = `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim();
    
    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email,
          name: name,
        },
      });
      console.log(`User ${id} successfully created in the database.`);
    } catch (error) {
      console.error('Error saving user to DB:', error);
      res.status(500).json({ error: 'Error saving user to DB' });
      return;
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await prisma.user.delete({
        where: { clerkId: id },
      });
      console.log(`User ${id} successfully deleted from the database.`);
    } catch (error) {
      console.error('Error deleting user from DB:', error);
      res.status(500).json({ error: 'Error deleting user from DB' });
      return;
    }
  }

  res.status(200).json({ success: true });
});

export default router;
