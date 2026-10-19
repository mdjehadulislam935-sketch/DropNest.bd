import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Search,
  Send,
  Trash2,
  User,
  X
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { InternalMessage, UserRole } from '../../../types/platform.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';

const MAX_WORD_COUNT = 260;
const EMAILS_PER_PAGE = 15;

export const SuperAdminMailboxModule: React.FC = () => {
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'draft' | 'trash'>('inbox');
  const [loading, setLoading] = useState(true);

  // Pagination (Strict 15 limit)
  const [currentPage, setCurrentPage] = useState(1);

  // Compose State
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientSuggestions, setRecipientSuggestions] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [composeMsg, setComposeMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Viewing Single Message
  const [viewingMessage, setViewingMessage] = useState<InternalMessage | null>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  // Live Word Counter
  const countWords = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const currentWordCount = countWords(body);
  const isWordCountExceeded = currentWordCount > MAX_WORD_COUNT;

  const loadMessages = async () => {
    setLoading(true);
    try {
      const list = await ApiService.getMessages(activeTab);
      setMessages(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'compose') {
      loadMessages();
    }
  }, [activeTab]);

  // Recipient autocomplete by registered mobile number
  useEffect(() => {
    if (recipientQuery.length >= 3 && !selectedRecipient) {
      const timer = setTimeout(async () => {
        try {
          const results = await ApiService.lookupRecipients(recipientQuery);
          setRecipientSuggestions(results);
        } catch {
          setRecipientSuggestions([]);
        }
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setRecipientSuggestions([]);
    }
  }, [recipientQuery, selectedRecipient]);

  const handleSelectRecipient = (user: any) => {
    setSelectedRecipient(user);
    setRecipientQuery(`${user.fullName} (${user.mobile}) - ${user.role}`);
    setRecipientSuggestions([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient && !recipientQuery) return;
    if (isWordCountExceeded) {
      setComposeMsg({
        success: false,
        text: `Message exceeds the strict ${MAX_WORD_COUNT} word platform limit. Current: ${currentWordCount} words.`,
      });
      return;
    }

    setSending(true);
    setComposeMsg(null);
    try {
      const mobile = selectedRecipient ? selectedRecipient.mobile : recipientQuery;
      await ApiService.sendMessage(mobile, subject, body, images);
      setComposeMsg({
        success: true,
        text: `Message successfully dispatched to ${mobile} via internal DropNest message bus.`,
      });
      setRecipientQuery('');
      setSelectedRecipient(null);
      setSubject('');
      setBody('');
      setImages([]);
      setTimeout(() => {
        setComposeMsg(null);
        setActiveTab('inbox');
      }, 2000);
    } catch (err: any) {
      setComposeMsg({
        success: false,
        text: err.message || 'Failed to dispatch message',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Move this message to trash?')) return;
    try {
      await ApiService.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (viewingMessage?.id === id) {
        setViewingMessage(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete message');
    }
  };

  // Pagination slicing (Exact 15 per page)
  const totalPages = Math.ceil(messages.length / EMAILS_PER_PAGE) || 1;
  const paginatedMessages = messages.slice(
    (currentPage - 1) * EMAILS_PER_PAGE,
    currentPage * EMAILS_PER_PAGE
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">14. Internal Sovereign E-mail Box</h2>
            <p className="text-xs text-[#C9C4D6]">
              End-to-end platform communications (15 Emails per View · Strict 260 Words Max per Message)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose Message</span>
          </button>

          <button
            onClick={loadMessages}
            className="p-2 rounded-lg bg-[#100D1B] border border-[#302741] text-[#C9C4D6] hover:text-white"
            title="Refresh Mailbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741] w-fit">
        <button
          onClick={() => {
            setActiveTab('inbox');
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'inbox' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Inbox</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sent');
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'sent' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Sent Dispatches</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('draft');
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'draft' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Drafts</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('trash');
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
            activeTab === 'trash' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6]'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Trash</span>
        </button>
      </div>

      {/* Compose View */}
      {activeTab === 'compose' && (
        <form onSubmit={handleSendMessage} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-3xl">
          <div className="border-b border-[#302741] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#EC4899]">
              Compose Internal Message
            </h3>
            <span className="text-xs font-mono text-[#22D3EE]">
              Limit: Max {MAX_WORD_COUNT} Words · Autocomplete Enabled
            </span>
          </div>

          {composeMsg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                composeMsg.success
                  ? 'bg-[#34D399]/15 border-[#34D399]/30 text-[#34D399]'
                  : 'bg-[#F87171]/15 border-[#F87171]/30 text-[#F87171]'
              }`}
            >
              {composeMsg.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{composeMsg.text}</span>
            </div>
          )}

          <div className="space-y-3 text-xs relative">
            {/* Recipient Lookup */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Recipient (Lookup by Registered Mobile Number / Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientQuery}
                  onChange={(e) => {
                    setRecipientQuery(e.target.value);
                    if (selectedRecipient) setSelectedRecipient(null);
                  }}
                  placeholder="Type registered 01XXXXXXXXX mobile number..."
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white font-mono focus:border-[#7C3AED]"
                  required
                />

                {/* Suggestions Dropdown */}
                {recipientSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#100D1B] border border-[#7C3AED] rounded-lg shadow-2xl z-30 divide-y divide-[#302741] max-h-48 overflow-y-auto">
                    {recipientSuggestions.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectRecipient(u)}
                        className="p-2.5 hover:bg-[#171226] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-bold text-white">{u.fullName}</div>
                          <div className="text-[11px] font-mono text-[#22D3EE]">{u.mobile}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#A855F7] text-[10px] font-bold">
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-1">Message Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Courier Pickup Schedule Update - Dhaka North Hub"
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-white">Message Body</label>
                <span
                  className={`font-mono text-xs font-bold ${
                    isWordCountExceeded ? 'text-[#F87171] animate-pulse' : 'text-[#34D399]'
                  }`}
                >
                  {currentWordCount} / {MAX_WORD_COUNT} Words{' '}
                  {isWordCountExceeded && '(Exceeds Limit!)'}
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write message details (maximum 260 words allowed)..."
                className={`w-full bg-[#100D1B] border rounded-lg p-3 text-white text-xs ${
                  isWordCountExceeded ? 'border-[#F87171] focus:ring-1 focus:ring-[#F87171]' : 'border-[#302741] focus:border-[#7C3AED]'
                }`}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#C9C4D6]">
                Attachments: Up to 3 screenshot files (Max 4MB each)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2 text-[#C9C4D6] hover:bg-[#302741] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || isWordCountExceeded}
                  className={`px-5 py-2 font-bold rounded-lg text-white flex items-center gap-1.5 shadow-md ${
                    isWordCountExceeded
                      ? 'bg-[#302741] text-[#C9C4D6] cursor-not-allowed'
                      : 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Transmitting...' : 'Dispatch Message'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Messages List (Inbox / Sent / Draft / Trash) */}
      {activeTab !== 'compose' && (
        <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
          <div className="p-3 bg-[#100D1B] border-b border-[#302741] flex items-center justify-between text-xs font-semibold text-white">
            <span className="capitalize">{activeTab} Ledger ({messages.length} Total Messages)</span>
            <span className="text-[11px] font-mono text-[#22D3EE]">
              Page {currentPage} of {totalPages} (Strict {EMAILS_PER_PAGE} per view)
            </span>
          </div>

          <div className="divide-y divide-[#302741]">
            {paginatedMessages.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#C9C4D6]">
                <Mail className="w-8 h-8 mx-auto text-[#302741] mb-2" />
                <p>No messages in this folder.</p>
              </div>
            ) : (
              paginatedMessages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setViewingMessage(msg)}
                  className={`p-4 flex items-center justify-between gap-3 hover:bg-[#100D1B] cursor-pointer transition-colors ${
                    !msg.isRead ? 'bg-[#7C3AED]/5 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        !msg.isRead ? 'bg-[#22D3EE]' : 'bg-transparent'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">
                          {activeTab === 'sent' ? `To: ${msg.recipientName}` : `From: ${msg.senderName}`}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#302741] font-mono text-[#A855F7]">
                          {activeTab === 'sent' ? msg.recipientRole : msg.senderRole}
                        </span>
                      </div>
                      <h4 className="text-xs text-white truncate mt-0.5">{msg.subject}</h4>
                      <p className="text-[11px] text-[#C9C4D6] line-clamp-1">{msg.body}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="font-mono text-[10px] text-[#22D3EE]">
                      <div>{formatBangladeshDateTime(msg.createdAt)}</div>
                      <div className="text-[#C9C4D6]/70">{msg.wordCount} words</div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(msg.id);
                      }}
                      className="p-1.5 rounded text-[#C9C4D6] hover:text-[#F87171] hover:bg-[#F87171]/10"
                      title="Move to trash"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 bg-[#100D1B] border-t border-[#302741] flex items-center justify-between text-xs text-[#C9C4D6]">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-[#171226] border border-[#302741] disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous 15</span>
              </button>

              <span className="font-mono">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-[#171226] border border-[#302741] disabled:opacity-40 flex items-center gap-1"
              >
                <span>Next 15</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message Inspection Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#171226] border border-[#302741] rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#302741] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{viewingMessage.subject}</h3>
                <div className="text-xs text-[#C9C4D6] mt-0.5">
                  From: <strong className="text-white">{viewingMessage.senderName}</strong> ({viewingMessage.senderMobile}) ·{' '}
                  <span className="text-[#A855F7] font-semibold">{viewingMessage.senderRole}</span>
                </div>
              </div>

              <button
                onClick={() => setViewingMessage(null)}
                className="text-[#C9C4D6] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#100D1B] border border-[#302741] text-xs text-white leading-relaxed whitespace-pre-wrap">
              {viewingMessage.body}
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#C9C4D6] font-mono">
              <span>Transmitted: {formatBangladeshDateTime(viewingMessage.createdAt)}</span>
              <span>Word Count: {viewingMessage.wordCount} words (Verified ≤ {MAX_WORD_COUNT})</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#302741]">
              <button
                onClick={() => handleDeleteMessage(viewingMessage.id)}
                className="px-3 py-1.5 text-xs text-[#F87171] hover:bg-[#F87171]/10 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedRecipient({
                    mobile: viewingMessage.senderMobile,
                    fullName: viewingMessage.senderName,
                    role: viewingMessage.senderRole,
                  });
                  setRecipientQuery(`${viewingMessage.senderName} (${viewingMessage.senderMobile})`);
                  setSubject(`Re: ${viewingMessage.subject}`);
                  setViewingMessage(null);
                  setActiveTab('compose');
                }}
                className="px-4 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
