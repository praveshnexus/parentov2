import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadSingleImage, uploadMultipleImages, uploadMedia } from '../middlewares/upload.middleware';
import { uploadLimiter, searchLimiter } from '../middlewares/rateLimiter';
import {
  PostController,
  AppointmentController,
  ChildController,
  UserController,
  AdminController,
  NotificationController,
  DoctorController,
} from '../controllers/index';

const router = Router();

// ──── POSTS ─────────────────────────────────────────────────
const posts = Router();
posts.get('/feed', authenticate, PostController.getFeed);
posts.get('/trending', PostController.getTrending);
posts.get('/search', searchLimiter, PostController.search);
posts.post('/', authenticate, uploadMedia, PostController.createPost);
posts.put('/:id', authenticate, PostController.updatePost);
posts.delete('/:id', authenticate, PostController.deletePost);
posts.post('/:id/like', authenticate, PostController.toggleLike);
posts.post('/:id/bookmark', authenticate, PostController.toggleBookmark);
posts.get('/bookmarks', authenticate, PostController.getBookmarks);
posts.get('/:id/comments', authenticate, PostController.getComments);
posts.post('/:id/comments', authenticate, PostController.addComment);
posts.delete('/:id/comments/:commentId', authenticate, PostController.deleteComment);
router.use('/posts', posts);

// ──── DOCTORS ────────────────────────────────────────────────
const doctors = Router();
doctors.get('/', DoctorController.list);
doctors.get('/my-profile', authenticate, authorize('DOCTOR'), DoctorController.getMyProfile);
doctors.get('/:id', DoctorController.getById);
doctors.post('/register', authenticate, DoctorController.register);
doctors.put('/profile', authenticate, authorize('DOCTOR'), DoctorController.update);
doctors.put('/availability', authenticate, authorize('DOCTOR'), DoctorController.setAvailability);
doctors.post('/:id/reviews', authenticate, DoctorController.addReview);
doctors.put('/:id/verify', authenticate, authorize('ADMIN'), DoctorController.verify);
router.use('/doctors', doctors);

// ──── APPOINTMENTS ───────────────────────────────────────────
const appts = Router();
appts.post('/', authenticate, AppointmentController.book);
appts.get('/', authenticate, AppointmentController.list);
appts.put('/:id/status', authenticate, AppointmentController.updateStatus);
router.use('/appointments', appts);

// ──── CHILDREN ───────────────────────────────────────────────
const children = Router();
children.get('/', authenticate, authorize('PARENT'), ChildController.list);
children.post('/', authenticate, authorize('PARENT'), ChildController.create);
children.get('/:id', authenticate, ChildController.get);
children.put('/:id', authenticate, ChildController.update);
children.delete('/:id', authenticate, ChildController.delete);
children.post('/:id/growth', authenticate, ChildController.addGrowth);
children.get('/:id/growth', authenticate, ChildController.getGrowth);
children.get('/:id/milestones', authenticate, ChildController.getMilestones);
children.patch('/:id/milestones/:milestoneId', authenticate, ChildController.toggleMilestone);
children.get('/:id/vaccinations', authenticate, ChildController.getVaccinations);
children.post('/:id/vaccinations', authenticate, ChildController.addVaccination);
router.use('/children', children);

// ──── USERS ──────────────────────────────────────────────────
const users = Router();
users.get('/profile', authenticate, UserController.getProfile);
users.put('/profile', authenticate, UserController.updateProfile);
users.post('/avatar', authenticate, uploadLimiter, uploadSingleImage, UserController.uploadAvatar);
users.delete('/account', authenticate, UserController.deleteAccount);
users.get('/search', searchLimiter, UserController.search);
router.use('/users', users);

// ──── NOTIFICATIONS ──────────────────────────────────────────
const notifs = Router();
notifs.get('/', authenticate, NotificationController.list);
notifs.get('/unread-count', authenticate, NotificationController.getUnreadCount);
notifs.put('/:id/read', authenticate, NotificationController.markRead);
notifs.put('/read-all', authenticate, NotificationController.markAllRead);
router.use('/notifications', notifs);

// ──── ADMIN ──────────────────────────────────────────────────
const admin = Router();
admin.use(authenticate, authorize('ADMIN'));
admin.get('/dashboard', AdminController.dashboard);
admin.get('/users', AdminController.getUsers);
admin.patch('/users/:id/toggle', AdminController.toggleUser);
admin.get('/doctors/pending', AdminController.getPendingDoctors);
admin.get('/reports', AdminController.getReports);
admin.put('/reports/:id', AdminController.resolveReport);
admin.get('/audit-logs', AdminController.getAuditLogs);
router.use('/admin', admin);

export default router;
