import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Eye,
  Globe,
  History,
  Layout,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Upload,
  Video
} from 'lucide-react';
import { ApiService } from '../../../services/api.ts';
import type { CompanyInfo, HomepageCMS, TutorialVideo } from '../../../types/platform.ts';
import { formatBangladeshDateTime } from '../../../utils/formatters.ts';

interface BusinessInfoModuleProps {
  initialSubmodule?: 'contact' | 'cms' | 'tutorials' | 'landing';
}

export const BusinessInfoModule: React.FC<BusinessInfoModuleProps> = ({
  initialSubmodule = 'contact',
}) => {
  const [submodule, setSubmodule] = useState<'contact' | 'cms' | 'tutorials' | 'landing'>(initialSubmodule);

  // 3.1 Company Info State
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [companyMsg, setCompanyMsg] = useState<string | null>(null);

  // 3.2 CMS State
  const [cms, setCms] = useState<HomepageCMS | null>(null);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsPublishing, setCmsPublishing] = useState(false);
  const [cmsMsg, setCmsMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 3.3 Tutorials State
  const [tutorials, setTutorials] = useState<TutorialVideo[]>([]);
  const [newTutTitle, setNewTutTitle] = useState('');
  const [newTutDesc, setNewTutDesc] = useState('');
  const [newTutCategory, setNewTutCategory] = useState<'Reseller Guides' | 'Supplier Manuals' | 'Order Fulfillment' | 'Financial Settlement'>('Reseller Guides');
  const [tutSaving, setTutSaving] = useState(false);
  const [tutMsg, setTutMsg] = useState<string | null>(null);

  const loadData = async () => {
    setCompanyLoading(true);
    try {
      const [comp, homepageCms, tuts] = await Promise.all([
        ApiService.getCompanyInfo().catch(() => null),
        ApiService.getHomepageCMS().catch(() => null),
        ApiService.getTutorials().catch(() => []),
      ]);
      setCompany(comp);
      setCms(homepageCms);
      setTutorials(tuts);
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Company Info
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setCompanySaving(true);
    setCompanyMsg(null);
    try {
      const updated = await ApiService.updateCompanyInfo(company);
      setCompany(updated);
      setCompanyMsg('Company information and official contact details successfully updated in database.');
      setTimeout(() => setCompanyMsg(null), 3500);
    } catch (err: any) {
      setCompanyMsg(err.message || 'Failed to update company info');
    } finally {
      setCompanySaving(false);
    }
  };

  // Save CMS Draft
  const handleSaveCmsDraft = async () => {
    if (!cms) return;
    setCmsSaving(true);
    try {
      const updated = await ApiService.updateHomepageCMS(cms);
      setCms(updated);
      setCmsMsg('Draft content saved securely in database.');
      setTimeout(() => setCmsMsg(null), 3000);
    } catch (err: any) {
      setCmsMsg(err.message || 'Failed to save draft');
    } finally {
      setCmsSaving(false);
    }
  };

  // Publish CMS
  const handlePublishCms = async () => {
    setCmsPublishing(true);
    try {
      const published = await ApiService.publishHomepageCMS();
      setCms(published);
      setCmsMsg('Homepage successfully published to the live DropNest public website!');
      setTimeout(() => setCmsMsg(null), 4000);
    } catch (err: any) {
      setCmsMsg(err.message || 'Failed to publish');
    } finally {
      setCmsPublishing(false);
    }
  };

  // Restore CMS
  const handleRestoreCms = async () => {
    if (!confirm('Are you sure you want to restore the previous published homepage version?')) return;
    try {
      const restored = await ApiService.restoreHomepageCMS();
      setCms(restored);
      setCmsMsg('Successfully restored previous published homepage version.');
      setTimeout(() => setCmsMsg(null), 3500);
    } catch (err: any) {
      setCmsMsg(err.message || 'Failed to restore');
    }
  };

  // Create Tutorial
  const handleCreateTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTutTitle) return;
    setTutSaving(true);
    try {
      const tut = await ApiService.createTutorial({
        title: newTutTitle,
        description: newTutDesc,
        category: newTutCategory,
        thumbnailUrl: '/Image/Dashboard Background.jpg',
        videoUrl: 'https://youtube.com/watch?v=dropnest_tut',
        orderPosition: tutorials.length + 1,
        isPublished: true,
      });
      setTutorials([...tutorials, tut]);
      setNewTutTitle('');
      setNewTutDesc('');
      setTutMsg('Tutorial video added to knowledge base.');
      setTimeout(() => setTutMsg(null), 3000);
    } catch (err: any) {
      setTutMsg(err.message || 'Failed to create tutorial');
    } finally {
      setTutSaving(false);
    }
  };

  // Delete Tutorial
  const handleDeleteTutorial = async (id: string) => {
    if (!confirm('Confirm deletion of this tutorial video?')) return;
    try {
      await ApiService.deleteTutorial(id);
      setTutorials((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-5">
      {/* Module Title & Submodule Tabs */}
      <div className="bg-[#171226] border border-[#302741] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">1. Business Information & CMS Engine</h2>
            <p className="text-xs text-[#C9C4D6]">
              Company profiles, public website content, video tutorials, and landing page publishing
            </p>
          </div>
        </div>

        {/* Submodule Segmented Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#100D1B] rounded-lg border border-[#302741]">
          <button
            onClick={() => setSubmodule('contact')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'contact' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            3.1 Contact Info
          </button>
          <button
            onClick={() => setSubmodule('cms')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'cms' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            3.2 Homepage Editor
          </button>
          <button
            onClick={() => setSubmodule('tutorials')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'tutorials' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            3.3 Tutorial Videos
          </button>
          <button
            onClick={() => setSubmodule('landing')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              submodule === 'landing' ? 'bg-[#7C3AED] text-white' : 'text-[#C9C4D6] hover:text-white'
            }`}
          >
            3.4 Landing Page
          </button>
        </div>
      </div>

      {/* 3.1 Company Update Contact Information */}
      {submodule === 'contact' && company && (
        <form onSubmit={handleSaveCompany} className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-4xl">
          <div className="border-b border-[#302741] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#A855F7]">
              Company Update Contact Information
            </h3>
            <span className="text-[11px] text-[#C9C4D6]">
              Last updated: {formatBangladeshDateTime(company.updatedAt)} by {company.updatedBy}
            </span>
          </div>

          {companyMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{companyMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Company Legal Name</label>
              <input
                type="text"
                value={company.companyName}
                onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Official Mobile Number</label>
              <input
                type="text"
                value={company.officialMobile}
                onChange={(e) => setCompany({ ...company, officialMobile: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Support Mobile Number</label>
              <input
                type="text"
                value={company.supportMobile}
                onChange={(e) => setCompany({ ...company, supportMobile: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Official Email Address</label>
              <input
                type="email"
                value={company.officialEmail}
                onChange={(e) => setCompany({ ...company, officialEmail: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">WhatsApp Business Number</label>
              <input
                type="text"
                value={company.whatsappNumber}
                onChange={(e) => setCompany({ ...company, whatsappNumber: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Official Website URL</label>
              <input
                type="text"
                value={company.websiteUrl || ''}
                onChange={(e) => setCompany({ ...company, websiteUrl: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white font-mono"
                placeholder="Dropnest.com.bd"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Facebook Community Link</label>
              <input
                type="url"
                value={company.facebookUrl || ''}
                onChange={(e) => setCompany({ ...company, facebookUrl: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Registered Company HQ Address</label>
            <textarea
              value={company.companyAddress}
              onChange={(e) => setCompany({ ...company, companyAddress: e.target.value })}
              rows={2}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="submit"
              disabled={companySaving}
              className="px-5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{companySaving ? 'Saving Changes...' : 'Save Company Information'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3.2 Home Page Information Editor */}
      {submodule === 'cms' && cms && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-4xl">
          <div className="border-b border-[#302741] pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#22D3EE]">
                Homepage CMS Content Editor
              </h3>
              <p className="text-xs text-[#C9C4D6]">
                Status: <span className="font-bold text-[#34D399]">{cms.status}</span> · Updated: {formatBangladeshDateTime(cms.updatedAt)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreCms}
                className="px-3 py-1.5 rounded-lg bg-[#100D1B] border border-[#302741] hover:text-white text-xs text-[#C9C4D6] flex items-center gap-1"
                title="Restore previous published version"
              >
                <History className="w-3.5 h-3.5" />
                <span>Restore Previous</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCmsDraft}
                disabled={cmsSaving}
                className="px-3 py-1.5 rounded-lg bg-[#302741] hover:bg-[#302741]/80 text-white text-xs font-semibold"
              >
                {cmsSaving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={handlePublishCms}
                disabled={cmsPublishing}
                className="px-4 py-1.5 rounded-lg bg-[#34D399] hover:bg-[#10B981] text-black text-xs font-bold shadow-md"
              >
                {cmsPublishing ? 'Publishing...' : 'Publish Changes'}
              </button>
            </div>
          </div>

          {cmsMsg && (
            <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{cmsMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white mb-1">Website Brand Name</label>
              <input
                type="text"
                value={cms.websiteName}
                onChange={(e) => setCms({ ...cms, websiteName: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Tagline</label>
              <input
                type="text"
                value={cms.tagline}
                onChange={(e) => setCms({ ...cms, tagline: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Homepage Title</label>
              <input
                type="text"
                value={cms.homeTitle}
                onChange={(e) => setCms({ ...cms, homeTitle: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Banner Button Text</label>
              <input
                type="text"
                value={cms.bannerButtonText}
                onChange={(e) => setCms({ ...cms, bannerButtonText: e.target.value })}
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Banner Headline</label>
            <input
              type="text"
              value={cms.bannerHeadline}
              onChange={(e) => setCms({ ...cms, bannerHeadline: e.target.value })}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Promotional Offer Announcement</label>
            <input
              type="text"
              value={cms.promotionalOfferText}
              onChange={(e) => setCms({ ...cms, promotionalOfferText: e.target.value })}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white mb-1">Footer About Paragraph</label>
            <textarea
              value={cms.footerAbout}
              onChange={(e) => setCms({ ...cms, footerAbout: e.target.value })}
              rows={2}
              className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white"
            />
          </div>
        </div>
      )}

      {/* 3.3 Home Tutorial Upload Video */}
      {submodule === 'tutorials' && (
        <div className="space-y-4 max-w-4xl">
          <form onSubmit={handleCreateTutorial} className="bg-[#171226] border border-[#302741] p-5 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#EC4899]">
              Upload / Add Tutorial Video
            </h3>

            {tutMsg && (
              <div className="p-3 rounded-lg bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{tutMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">Video Title</label>
                <input
                  type="text"
                  value={newTutTitle}
                  onChange={(e) => setNewTutTitle(e.target.value)}
                  placeholder="e.g. Fulfilling Steadfast Orders on DropNest"
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">Tutorial Category</label>
                <select
                  value={newTutCategory}
                  onChange={(e) => setNewTutCategory(e.target.value as any)}
                  className="w-full bg-[#100D1B] border border-[#302741] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="Reseller Guides">Reseller Guides</option>
                  <option value="Supplier Manuals">Supplier Manuals</option>
                  <option value="Order Fulfillment">Order Fulfillment</option>
                  <option value="Financial Settlement">Financial Settlement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white mb-1">Video Description</label>
              <textarea
                value={newTutDesc}
                onChange={(e) => setNewTutDesc(e.target.value)}
                rows={2}
                placeholder="Walkthrough steps and actionable takeaways..."
                className="w-full bg-[#100D1B] border border-[#302741] rounded-lg p-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={tutSaving}
                className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tutSaving ? 'Adding...' : 'Add Video Tutorial'}</span>
              </button>
            </div>
          </form>

          {/* Tutorial List */}
          <div className="bg-[#171226] border border-[#302741] rounded-xl overflow-hidden">
            <div className="p-3 border-b border-[#302741] bg-[#100D1B] text-xs font-semibold text-white">
              Tutorial Video Knowledge Base ({tutorials.length})
            </div>

            <div className="divide-y divide-[#302741]">
              {tutorials.map((tut) => (
                <div key={tut.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#100D1B] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-[#7C3AED]/20 text-[#A855F7]">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{tut.title}</h4>
                      <p className="text-xs text-[#C9C4D6] line-clamp-1">{tut.description}</p>
                      <div className="text-[11px] text-[#22D3EE] font-mono mt-0.5">
                        Category: {tut.category} · Position #{tut.orderPosition}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTutorial(tut.id)}
                    className="p-1.5 rounded text-[#C9C4D6] hover:text-[#F87171] hover:bg-[#F87171]/10"
                    title="Delete tutorial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3.4 Home Landing Page Update */}
      {submodule === 'landing' && (
        <div className="bg-[#171226] border border-[#302741] p-6 rounded-xl space-y-4 max-w-4xl">
          <div className="flex items-center justify-between border-b border-[#302741] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#34D399]">
                Landing Page Section Governance
              </h3>
              <p className="text-xs text-[#C9C4D6]">
                Configure, reorder, preview and publish the public landing storefront
              </p>
            </div>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'Close Preview' : 'Live Preview'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {[
              { id: '1', title: 'Hero Section & Reseller Call to Action', enabled: true },
              { id: '2', title: 'Platform Value Proposition & 64 Districts COD', enabled: true },
              { id: '3', title: 'How DropNest Works (Supplier to Reseller to Customer)', enabled: true },
              { id: '4', title: 'Featured Wholesale Factory Products & Catalog', enabled: true },
              { id: '5', title: 'Supplier & Reseller Dual Onboarding Portals', enabled: true },
              { id: '6', title: 'Customer Testimonials & Financial Trust Markers', enabled: true },
            ].map((sec) => (
              <div key={sec.id} className="p-3 bg-[#100D1B] border border-[#302741] rounded-lg flex items-center justify-between">
                <span className="text-xs font-semibold text-white">{sec.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#34D399]/20 text-[#34D399]">
                  ACTIVE ON SITE
                </span>
              </div>
            ))}
          </div>

          {showPreview && (
            <div className="mt-4 p-4 rounded-xl border border-[#7C3AED] bg-[#080611] space-y-3">
              <div className="text-xs font-bold text-[#A855F7] uppercase tracking-wider">
                Storefront Live Simulator
              </div>
              <div className="p-6 text-center border border-[#302741] rounded-lg bg-[#171226]/50">
                <h4 className="text-lg font-bold text-white">{cms?.bannerHeadline}</h4>
                <p className="text-xs text-[#C9C4D6] mt-1 max-w-md mx-auto">{cms?.homeDescription}</p>
                <div className="mt-3">
                  <span className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-bold rounded-lg inline-block">
                    {cms?.bannerButtonText}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
