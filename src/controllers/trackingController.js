import { getTracking } from '../services/trackingService.js';

export async function get(req, res) {
  const tracking = await getTracking(req.params.trackingCode);
  res.json({ tracking });
}
