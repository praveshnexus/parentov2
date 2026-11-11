import { useState, useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Plus,
  Image,
  Send,
  Trash2,
  X,
  Bookmark,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { postsApi } from "@/api/services";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Modal,
} from "@/components/ui";
import type { Post, Comment } from "@/types";
import clsx from "clsx";

// ── Left sidebar (desktop) — matches File 1 ──────────────────
function LeftSidebar() {
  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-primary-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Welcome to Parento!</h2>
        <p className="text-primary-100 text-sm mt-1 leading-relaxed">
          Your trusted companion in parenting journey
        </p>
        <div className="flex gap-1 mt-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 rounded-full",
                i === 0 ? "w-6 bg-white" : "w-2 bg-white/40",
              )}
            />
          ))}
        </div>
      </div>

      {/* Discussion Forums */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
          <p className="font-semibold text-sm text-ink-primary">
            Discussion Forums
          </p>
        </div>
        <div className="space-y-3">
          {[
            {
              title: "Parenting Tips & Advice",
              desc: "Share experience and get advice from other parents.",
              members: "2.5k",
              active: "150",
            },
            {
              title: "Parenting Tips & Advice",
              desc: "Share experience and get advice from other parents.",
              members: "2.5k",
              active: "150",
            },
          ].map((f, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-semibold text-ink-primary">
                {f.title}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                {f.desc}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {f.members} members
                </span>
                <span>{f.active} active discussions</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Local Meetups */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-primary-400" />
          <p className="font-semibold text-sm text-ink-primary">
            Local Meetups
          </p>
        </div>
        <div className="space-y-3">
          {[
            {
              title: "Weekend Playdate",
              location: "Central Park, New York",
              date: "Sat, Aug 20, 10:00 AM",
            },
            {
              title: "Parent Support Group",
              location: "Community Center",
              date: "Wed, Aug 14, 2:00 PM",
            },
          ].map((m, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-primary">
                  {m.title}
                </p>
                <p className="text-xs text-ink-muted mt-0.5">{m.location}</p>
                <p className="text-xs text-ink-muted">{m.date}</p>
              </div>
              <button className="flex-shrink-0 px-3 py-1.5 rounded-pill bg-primary-500 text-white text-xs font-semibold hover:bg-primary-600 transition-colors">
                Join
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Featured Resources */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <p className="font-semibold text-sm text-ink-primary">
            Featured Resources
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: "📖",
              label: "Parenting Guide",
              desc: "Essential tips for new parents",
            },
            {
              icon: "🎬",
              label: "Video Library",
              desc: "Expert talks and tutorials.",
            },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="p-3 bg-gray-50 rounded-xl">
              <span className="text-xl">{icon}</span>
              <p className="text-xs font-semibold text-ink-primary mt-1.5">
                {label}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Comment item ───────────────────────────────────────────────
function CommentItem({ c }: { c: Comment }) {
  return (
    <div className="flex gap-2.5">
      <Avatar
        src={c.author?.avatarUrl}
        name={c.author?.fullName ?? "User"}
        size="xs"
        className="mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2">
        <p className="text-xs font-semibold text-ink-primary">
          {c.author?.fullName ?? "Anonymous"}
        </p>
        <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
          {c.content}
        </p>
        <p className="text-[10px] text-ink-muted mt-1">
          {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ""}
        </p>
      </div>
    </div>
  );
}

// ── Comments panel ─────────────────────────────────────────────
function CommentsPanel({ postId }: { postId: string }) {
  const { data } = useInfiniteQuery({
    queryKey: ["comments", postId],
    queryFn: ({ pageParam = 1 }) => postsApi.getComments(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last: any) =>
      last?.data?.meta?.hasNext ? (last?.data?.meta?.page ?? 1) + 1 : undefined,
  });
  const comments = Array.isArray(data?.pages)
    ? data.pages.flatMap((p: any) => p?.data?.data ?? [])
    : [];
  if (!comments.length)
    return (
      <p className="text-xs text-ink-muted text-center py-3">No comments yet</p>
    );
  return (
    <div className="space-y-2.5 max-h-48 overflow-y-auto px-4 py-2">
      {comments.map((c: Comment) => (
        <CommentItem key={c.id} c={c} />
      ))}
    </div>
  );
}

// ── Post card ──────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const likeMutation = useMutation({
    mutationFn: () => postsApi.toggleLike(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      queryClient.setQueryData(["feed"], (old: any) => {
        if (!old || !Array.isArray(old.pages)) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: {
              ...page?.data,
              data: Array.isArray(page?.data?.data)
                ? page.data.data.map((p: Post) =>
                    p.id === post.id
                      ? {
                          ...p,
                          isLiked: !p.isLiked,
                          likesCount: p.isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
                        }
                      : p,
                  )
                : [],
            },
          })),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed-highlights"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => postsApi.toggleBookmark(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed-highlights"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => postsApi.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed-highlights"] });
      toast.success("Post deleted");
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => postsApi.addComment(post.id, content),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["comments", post.id] });
    },
  });

  return (
    <Card className="overflow-hidden">
      {/* Author row - now with bookmark/trash */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Avatar
          src={post.author?.avatarUrl}
          name={post.author?.fullName ?? "User"}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-ink-primary">
            {post.author?.fullName ?? "Anonymous"}
          </p>
          <p className="text-xs text-ink-muted">
            {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ""}
          </p>
        </div>
        {user?.id === post.authorId ? (
          <button
            onClick={() => deleteMutation.mutate()}
            className="p-2 rounded-full hover:bg-red-50 text-ink-muted hover:text-red-500 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        ) : (
          <button
            onClick={() => bookmarkMutation.mutate()}
            className={clsx(
              "p-2 rounded-full transition-colors",
              post.isBookmarked
                ? "text-primary-500"
                : "text-ink-muted hover:text-primary-400",
            )}
          >
            <Bookmark
              size={15}
              className={post.isBookmarked ? "fill-current" : ""}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-ink-primary leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-primary-500 font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (
        <div
          className={clsx(
            "grid gap-1 px-4 pb-3",
            post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {post.mediaUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="rounded-xl object-cover w-full h-48"
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="flex items-center gap-3 px-4 pb-1.5 text-xs text-ink-muted">
          {post.likesCount > 0 && (
            <span>
              {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
            </span>
          )}
          {post.commentsCount > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline"
            >
              {post.commentsCount}{" "}
              {post.commentsCount === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* Actions - Like, Comment, Share only (bookmark moved) */}
      <div className="flex items-center border-t border-gray-100 px-2 py-0.5">
        <button
          onClick={() => likeMutation.mutate()}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors",
            post.isLiked
              ? "text-red-500"
              : "text-ink-secondary hover:text-red-400 hover:bg-red-50",
          )}
        >
          <Heart size={16} className={post.isLiked ? "fill-current" : ""} />
          <span className="hidden sm:inline">Like</span>
          {post.likesCount > 0 && (
            <span className="sm:hidden text-xs">{post.likesCount}</span>
          )}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:text-primary-500 hover:bg-primary-50 transition-colors"
        >
          <MessageCircle size={16} />
          <span className="hidden sm:inline">Comment</span>
          {post.commentsCount > 0 && (
            <span className="sm:hidden text-xs">{post.commentsCount}</span>
          )}
        </button>
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              window.location.origin + "/post/" + post.id,
            );
            toast.success("Link copied!");
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-ink-secondary hover:text-green-500 hover:bg-green-50 transition-colors"
        >
          <Share2 size={16} />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comments panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <CommentsPanel postId={post.id} />
            <div className="flex gap-2.5 px-4 py-3 border-t border-gray-100">
              <Avatar
                src={user?.avatarUrl}
                name={user?.fullName ?? ""}
                size="xs"
                className="flex-shrink-0 mt-0.5"
              />
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-gray-50 rounded-pill px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-100 text-ink-primary placeholder:text-ink-muted"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentText.trim()) {
                      e.preventDefault();
                      commentMutation.mutate(commentText.trim());
                    }
                  }}
                />
                <button
                  onClick={() =>
                    commentText.trim() &&
                    commentMutation.mutate(commentText.trim())
                  }
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ── Create Post Modal ──────────────────────────────────────────
function CreatePostModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("content", content);
      files.forEach((f) => fd.append("media", f));
      return postsApi.create(fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed-highlights"] });
      setContent("");
      setFiles([]);
      setPreviews([]);
      onClose();
      toast.success("Post published!");
    },
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post">
      <div className="px-5 py-4 space-y-4">
        <div className="flex gap-3">
          <Avatar
            src={user?.avatarUrl}
            name={user?.fullName ?? ""}
            size="md"
            className="flex-shrink-0"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community..."
            className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 text-sm text-ink-primary placeholder:text-ink-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 min-h-[100px]"
          />
        </div>
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} className="rounded-xl h-24 w-full object-cover" />
                <button
                  onClick={() => {
                    setFiles((f) => f.filter((_, j) => j !== i));
                    setPreviews((p) => p.filter((_, j) => j !== i));
                  }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary cursor-pointer hover:text-primary-500 transition-colors">
            <Image size={18} /> Add photo
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFiles}
              className="hidden"
            />
          </label>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!content.trim()}
            size="sm"
          >
            Publish
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Community Page ────────────────────────────────────────
export default function CommunityPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed-highlights"] });
    };
    socket.on("post:new", handler);
    socket.on("post:liked", handler);
    return () => {
      socket.off("post:new", handler);
      socket.off("post:liked", handler);
    };
  }, [socket, queryClient]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["feed"],
      queryFn: ({ pageParam = 1 }) => postsApi.getFeed(pageParam),
      initialPageParam: 1,
      getNextPageParam: (last: any) =>
        last?.data?.meta?.hasNext ? (last?.data?.meta?.page ?? 1) + 1 : undefined,
    });

  const posts = Array.isArray(data?.pages)
    ? data.pages.flatMap((p: any) => p?.data?.data ?? [])
    : [];

  return (
    <div className="max-w-app mx-auto">
      {/* Sticky header bar – matches File 1 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 md:top-16 z-20">
        <div className="max-w-app mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-bold text-ink-primary">
              Community
            </h1>
            <p className="text-xs text-primary-500 font-medium">
              Share your Experience
            </p>
          </div>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            New Post
          </Button>
        </div>
      </div>

      {/* Body – 2‑column layout */}
      <div className="px-4 py-4">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6">
          {/* Left sidebar (desktop) */}
          <div className="hidden lg:block">
            <LeftSidebar />
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {/* Mobile welcome banner */}
            <div className="lg:hidden bg-primary-500 rounded-2xl p-5 text-white">
              <h2 className="text-xl font-bold">Welcome to Parento!</h2>
              <p className="text-primary-100 text-sm mt-1">
                Your trusted companion in parenting journey
              </p>
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <h2 className="text-[15px] font-semibold text-ink-primary">
                  Parent Discussion Forum
                </h2>
              </div>
              <button
                onClick={() => setCreateOpen(true)}
                className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1"
              >
                <Plus size={13} /> New Post
              </button>
            </div>

            {/* Create post bar – matches File 1 */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.fullName ?? ""}
                  size="md"
                />
                <button
                  onClick={() => setCreateOpen(true)}
                  className="flex-1 text-left bg-surface-bg rounded-pill px-4 py-2.5 text-sm text-ink-muted hover:bg-primary-50 transition-colors"
                >
                  What's on your mind?
                </button>
              </div>
            </Card>

            {/* Posts */}
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-card shadow-card p-4 space-y-3 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-28" />
                      <div className="h-2.5 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded" />
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                  </div>
                </div>
              ))
            ) : posts.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={28} />}
                title="No posts yet"
                description="Be the first to share something with the community!"
                action={
                  <Button
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={() => setCreateOpen(true)}
                  >
                    Create post
                  </Button>
                }
              />
            ) : (
              <AnimatePresence>
                {posts.map((post: Post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-3 text-sm font-medium text-primary-500 hover:text-primary-600 transition-colors"
              >
                {isFetchingNextPage ? "Loading..." : "Load more posts"}
              </button>
            )}
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
