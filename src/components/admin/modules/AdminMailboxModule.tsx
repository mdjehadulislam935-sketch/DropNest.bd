import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Image,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { ApiService } from '../../../services/api.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';
import type { InternalMessage, UserRole } from '../../../types/platform.ts';
import type { AdminPermissions } from '../../../types/admin.ts';

export const AdminMailboxModule: React.FC = () => {
  const { user } = useAuth();
  const [folder, setFolder] = useState<'INBOX' | 'SENT'>('INBOX');
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  // Compose State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [recipientType, setRecipientType] = useState<'SPECIFIC' | 'ALL_RESELLERS' | 'ALL_SUPPLIERS' | 'MODERATORS'>('SPECIFIC');
  const [recipientMobile, setRecipientMobile] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSending, setIsSending] = useState(false);

  // View Message Modal
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [msgList, perms] = await Promise.all([
        ApiService.getMessages(folder.toLowerCase()),
        ApiService.getAdminPermissions(),
      ]);
      setMessages(msgList);
      setPermissions(perms);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [folder]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!permissions?.canAccessMessaging && user?.role !== 'SUPER_ADMIN') {
      setFeedback({
        text: 'Permission Denied: Your admin profile does not have authorization to send internal messages.',
        isError: true,
      });
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setFeedback({ text: 'Please fill in both Subject and Message Body.', isError: true });
      return;
    }

    let targetMobile = recipientMobile;
    if (recipientType === 'ALL_RESELLERS') targetMobile = 'GROUP_RESELLERS';
    else if (recipientType === 'ALL_SUPPLIERS') targetMobile = 'GROUP_SUPPLIERS';
    else if (recipientType === 'MODERATORS') targetMobile = 'GROUP_MODERATORS';

    if (recipientType === 'SPECIFIC' && !targetMobile.trim()) {
      setFeedback({ text: 'Please specify recipient mobile number or user ID.', isError: true });
      return;
    }

    setIsSending(true);
    try {
      const attachments = attachmentName.trim() ? [attachmentName.trim()] : undefined;
      await ApiService.sendMessage(targetMobile, subject.trim(), body.trim(), attachments);
      setFeedback({ text: `Message dispatched successfully to ${targetMobile}.` });
      setIsComposeOpen(false);
      setSubject('');
      setBody('');
      setRecipientMobile('');
      setAttachmentName('');
      loadData();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to dispatch message.', isError: true });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await ApiService.deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
      setFeedback({ text: 'Message removed safely.' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to delete message.', isError: true });
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.subject.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      m.senderMobile.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedback.isError
              ? 'bg-[#F87171]/10 border-[#F87171]/40 text-[#F87171]'
              : 'bg-[#34D399]/10 border-[#34D399]/40 text-[#34D399]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? <AlertOctagon className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#171226] border border-[#302741] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">
              <Mail className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              Internal Stakeholder E-mail Box
            </h2>
          </div>
          <p className="text-xs text-[#C9C4D6] mt-1">
            Secure internal communication channel between Admins, Moderators, Resellers, and Verified Suppliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold text-white shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Message</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Folder Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#302741] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFolder('INBOX')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              folder === 'INBOX'
                ? 'bg-[#7C3AED] text-white shadow-md'
                : 'text-[#C9C4D6] hover:text-white hover:bg-[#171226]'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Inbox</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EC4899] text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFolder('SENT')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              folder === 'SENT'
                ? 'bg-[#7C3AED] text-white shadow-md'
                : 'text-[#C9C4D6] hover:text-white hover:bg-[#171226]'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Sent Messages</span>
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-[#C9C4D6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-[#100D1B] border border-[#302741] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#C9C4D6]/50 focus:outline-none focus:border-[#7C3AED]"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="bg-[#171226] border border-[#302741] rounded-2xl overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="p-12 text-center text-[#C9C4D6]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#7C3AED] mb-2" />
            <p className="text-xs">Loading mail archive...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-[#C9C4D6] text-xs">
            No messages found in your {folder.toLowerCase()} folder.
          </div>
        ) : (
          <div className="divide-y divide-[#302741]/60">
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#1C1630] transition-colors ${
                  !msg.isRead ? 'bg-[#7C3AED]/5 font-semibold' : ''
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Unread Indicator Dot */}
                  <div className="pt-1">
                    {!msg.isRead ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] inline-block animate-pulse" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-transparent inline-block" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {folder === 'INBOX' ? msg.senderName : `To: ${msg.recipientMobile}`}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-[#A855F7] bg-[#100D1B] border border-[#302741]">
                        {msg.senderMobile}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-white truncate mt-0.5">
                      {msg.subject}
                    </p>

                    <p className="text-[11px] text-[#C9C4D6]/70 truncate max-w-xl">
                      {msg.body}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-[10px] text-[#C9C4D6] whitespace-nowrap">
                    {formatBangladeshDateTime(msg.timestamp || msg.createdAt)}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMessage(msg.id);
                    }}
                    className="p-1.5 text-[#C9C4D6] hover:text-[#F87171] rounded-lg hover:bg-[#100D1B]"
                    title="Delete Message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#A855F7]" />
                <h3 className="text-sm font-bold text-white truncate max-w-sm">
                  {selectedMessage.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-[#C9C4D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">From:</span>
                <span className="font-semibold text-white">
                  {selectedMessage.senderName} ({selectedMessage.senderMobile})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">To:</span>
                <span className="text-[#22D3EE] font-mono">{selectedMessage.recipientMobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#C9C4D6]">Date:</span>
                <span className="text-[#C9C4D6]">
                  {formatBangladeshDateTime(selectedMessage.timestamp || selectedMessage.createdAt)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] text-xs text-white leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedMessage.body}
            </div>

            {selectedMessage.images && selectedMessage.images.length > 0 && (
              <div className="p-3 rounded-xl bg-[#100D1B] border border-[#302741] space-y-2">
                <span className="text-[11px] font-semibold text-[#C9C4D6] block flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>Attachments ({selectedMessage.images.length})</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedMessage.images.map((img, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#171226] border border-[#302741] text-[10px] text-white font-mono flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-[#22D3EE]" />
                      <span>{img}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  setIsComposeOpen(true);
                  setRecipientType('SPECIFIC');
                  setRecipientMobile(selectedMessage.senderMobile);
                  setSubject(`Re: ${selectedMessage.subject}`);
                }}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>

              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-[#302741] hover:bg-[#3E3354] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSendMessage}
            className="bg-[#171226] border border-[#302741] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-[#A855F7]" />
                <h3 className="text-sm font-bold text-white">Compose Internal Message</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="text-[#C9C4D6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Recipient Category */}
              <div>
                <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                  Recipient Group *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'SPECIFIC', label: 'Specific User' },
                    { id: 'ALL_RESELLERS', label: 'All Resellers' },
                    { id: 'ALL_SUPPLIERS', label: 'All Suppliers' },
                    { id: 'MODERATORS', label: 'Moderators' },
                  ].map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRecipientType(r.id as any)}
                      className={`p-2 rounded-lg border text-center text-[11px] font-bold transition-all ${
                        recipientType === r.id
                          ? 'bg-[#7C3AED]/20 border-[#7C3AED] text-white'
                          : 'bg-[#100D1B] border-[#302741] text-[#C9C4D6]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Mobile (if specific) */}
              {recipientType === 'SPECIFIC' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                    Recipient Mobile Number / User ID *
                  </label>
                  <input
                    type="text"
                    value={recipientMobile}
                    onChange={(e) => setRecipientMobile(e.target.value)}
                    placeholder="01711000000 or usr_res_01"
                    className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Courier Policy Notice / Wholesale Inventory Update"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                  Message Body *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your internal message here..."
                  rows={4}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-xl p-3 text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Optional Attachment */}
              <div>
                <label className="block text-[11px] font-semibold text-[#C9C4D6] mb-1">
                  Optional Attachment Reference (Doc / Image Name)
                </label>
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[#C9C4D6]" />
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="e.g. Delivery_Rate_Card_2026.pdf"
                    className="flex-1 bg-[#100D1B] border border-[#302741] rounded-xl px-3 py-2 text-white placeholder-[#C9C4D6]/40 focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 bg-[#100D1B] hover:bg-[#1C1630] border border-[#302741] rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md"
              >
                {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Message</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
