import React, { useState } from 'react';
import Papa from "papaparse";
import { format } from "date-fns";
import { useAppStore } from "../context/appStore";
import { createEcoMission } from "../services/bounties";
import '../styles/admin.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [newEcoMissionSdg, setNewEcoMissionSdg] = useState(12);
  const [infoModal, setInfoModal] = useState(null);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const { 
    ecoMissions, 
    allSubmissions, 
    claims, 
    leaderboard, 
    adminInitialize, 
    approveSubmission, 
    rejectSubmission 
  } = useAppStore();

  React.useEffect(() => {
    const unsub = adminInitialize();
    return () => unsub();
  }, [adminInitialize]);

  const handleCreateEcoMission = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title');
    const coinsReward = parseInt(fd.get('coins'), 10);
    const theme = fd.get('type');
    const description = fd.get('description');
    const sdgNumber = newEcoMissionSdg;
    const sdgLabel = sdgNumber === 11 ? "Sustainable Cities" : sdgNumber === 12 ? "Responsible Consumption" : "Climate Action";
    
    if (!title || !coinsReward || !description) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await createEcoMission({
        title,
        description,
        instructions: description,
        theme,
        sdgNumber,
        sdgLabel,
        coinsReward,
        expiresAt,
        aiVerificationHint: `Ensure the photo shows ${description}`
      });
      alert("EcoMission created successfully!");
      setIsModalOpen(false);
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to create EcoMission");
    }
  };

  const exportCsv = () => {
    const csv = Papa.unparse(allSubmissions.map(s => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.studentName,
      ecoMissionTitle: s.ecoMissionTitle,
      theme: s.theme,
      sdg: s.sdgNumber,
      verdict: s.verdict,
      confidence: s.confidence,
      submittedAt: s.submittedAt,
      photoEvidence: s.photoURL || "No Photo"
    })));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `verde-admin-export-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
    a.click();
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    try {
      await approveSubmission(selectedSubmission.id, adminNote);
      alert("Submission approved!");
      setSelectedSubmission(null);
      setAdminNote("");
    } catch (err) {
      alert("Failed to approve: " + err.message);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;
    try {
      await rejectSubmission(selectedSubmission.id, adminNote);
      alert("Submission rejected!");
      setSelectedSubmission(null);
      setAdminNote("");
    } catch (err) {
      alert("Failed to reject: " + err.message);
    }
  };

  const totalApproved = allSubmissions.filter(s => s.verdict === "approved").length;
  const totalCoinsAwarded = allSubmissions.filter(s => s.verdict === "approved").reduce((acc, s) => acc + (s.coinsAwarded || 0), 0);
  const activeStudentsCount = new Set(allSubmissions.map(s => s.studentId)).size;
  const gmTarget = 5000;
  const gmPct = Math.min(100, Math.round((totalApproved / gmTarget) * 100) + 70);

  // Impact Calculations
  const approvedList = allSubmissions.filter(s => s.verdict === "approved" || s.status === "approved");
  const wasteDiverted = (approvedList.filter(s => s.theme === "canteen" || s.theme === "waste").length * 0.05).toFixed(1);
  const totalImpactValue = (totalApproved * 12.5).toLocaleString();

  return (
    <>
      <div className="app">
        <aside className="sidebar" aria-label="Primary">
          <div className="sidebar-brand-block">
            <div className="brand-row" style={{ gap: '6px' }}>
              <div className="brand-logo" aria-hidden="true" style={{ background: 'transparent' }}>
                <img src="/assets/verde-logo.png" alt="Verde Logo" className="h-9 w-9 object-contain" />
              </div>
              <div className="brand-text-col">
                <p className="brand-title" style={{ color: '#008b4e', fontWeight: 600 }}>Verde Admin</p>
                <p className="brand-sub">Digital Sustainability Hub</p>
              </div>
            </div>
          </div>
          <nav className="nav-block" aria-label="Main navigation">
            <ul className="nav-list">
              <li className={`nav-item ${activeTab === "dashboard" ? "is-active" : ""}`}>
                <button type="button" onClick={() => setActiveTab("dashboard")}>
                  <span className="nav-icon"><svg width="20" height="18" viewBox="0 0 20 18" fill="none"><path d="M2 16H6V8H2V16ZM8 16H12V2H8V16ZM14 16H18V10H14V16ZM0 18V6H6V0H14V8H20V18H0Z" fill="currentColor"/></svg></span>
                  <span className="nav-label">Dashboard</span>
                </button>
              </li>
              <li className={`nav-item ${activeTab === "verifications" ? "is-active" : ""}`}>
                <button type="button" onClick={() => setActiveTab("verifications")}>
                  <span className="nav-icon"><svg width="16" height="20" viewBox="0 0 16 20" fill="none"><path d="M6.95 13.55L12.6 7.9L11.175 6.475L6.95 10.7L4.85 8.6L3.425 10.025L6.95 13.55ZM8 20C5.68333 19.4167 3.77083 18.0875 2.2625 16.0125C0.754167 13.9375 0 11.6333 0 9.1V3L8 0L16 3V9.1C16 11.6333 15.2458 13.9375 13.7375 16.0125C12.2292 18.0875 10.3167 19.4167 8 20ZM8 17.9C9.73333 17.35 11.1667 16.25 12.3 14.6C13.4333 12.95 14 11.1167 14 9.1V4.375L8 2.125L2 4.375V9.1C2 11.1167 2.56667 12.95 3.7 14.6C4.83333 16.25 6.26667 17.35 8 17.9Z" fill="currentColor"/></svg></span>
                  <span className="nav-label">Verifications</span>
                </button>
              </li>
              <li className={`nav-item ${activeTab === "leaderboard" ? "is-active" : ""}`}>
                <button type="button" onClick={() => setActiveTab("leaderboard")}>
                  <span className="nav-icon"><svg width="20" height="20" viewBox="0 0 12 12" fill="none"><path d="M3.5 9.33333L5.83333 7.55417L8.16667 9.33333L7.29167 6.44583L9.625 4.78333H6.76667L5.83333 1.75L4.9 4.78333H2.04167L4.375 6.44583L3.5 9.33333ZM5.83333 11.6667C5.02639 11.6667 4.26806 11.5135 3.55833 11.2073C2.84861 10.901 2.23125 10.4854 1.70625 9.96042C1.18125 9.43542 0.765625 8.81806 0.459375 8.10833C0.153125 7.39861 0 6.64028 0 5.83333C0 5.02639 0.153125 4.26806 0.459375 3.55833C0.765625 2.84861 1.18125 2.23125 1.70625 1.70625C2.23125 1.18125 2.84861 0.765625 3.55833 0.459375C4.26806 0.153125 5.02639 0 5.83333 0C6.64028 0 7.39861 0.153125 8.10833 0.459375C8.81806 0.765625 9.43542 1.18125 9.96042 1.70625C10.4854 2.23125 10.901 2.84861 11.2073 3.55833C11.5135 4.26806 11.6667 5.02639 11.6667 5.83333C11.6667 6.64028 11.5135 7.39861 11.2073 8.10833C10.901 8.81806 10.4854 9.43542 9.96042 9.96042C9.43542 10.4854 8.81806 10.901 8.10833 11.2073C7.39861 11.5135 6.64028 11.6667 5.83333 11.6667ZM5.83333 10.5C7.13611 10.5 8.23958 10.0479 9.14375 9.14375C10.0479 8.23958 10.5 7.13611 10.5 5.83333C10.5 4.53056 10.0479 3.42708 9.14375 2.52292C8.23958 1.61875 7.13611 1.16667 5.83333 1.16667C4.53056 1.16667 3.42708 1.61875 2.52292 2.52292C1.61875 3.42708 1.16667 4.53056 1.16667 5.83333C1.16667 7.13611 1.61875 8.23958 2.52292 9.14375C3.42708 10.0479 4.53056 10.5 5.83333 10.5Z" fill="currentColor"/></svg></span>
                  <span className="nav-label">Leaderboard</span>
                </button>
              </li>
              <li className={`nav-item ${activeTab === "export" ? "is-active" : ""}`}>
                <button type="button" onClick={() => setActiveTab("export")}>
                  <span className="nav-icon"><svg width="16" height="21" viewBox="0 0 16 21" fill="none"><path d="M2 21C1.45 21 0.979167 20.8042 0.5875 20.4125C0.195833 20.0208 0 19.55 0 19V9C0 8.45 0.195833 7.97917 0.5875 7.5875C0.979167 7.19583 1.45 7 2 7H5V9H2V19H14V9H11V7H14C14.55 7 15.0208 7.19583 15.4125 7.5875C15.8042 7.97917 16 8.45 16 9V19C16 19.55 15.8042 20.0208 15.4125 20.4125C15.0208 20.8042 14.55 21 14 21H2ZM7 15V3.825L5.4 5.425L4 4L8 0L12 4L10.6 5.425L9 3.825V15H7Z" fill="currentColor"/></svg></span>
                  <span className="nav-label">Export</span>
                </button>
              </li>
            </ul>
          </nav>
          <div className="sidebar-footer">
            <img className="avatar-ring" src="/assets/avatar-header.png" width="44" height="44" alt="" />
            <div className="avatar-meta">
              <div className="name">Admin Avatar</div>
              <div className="role">Platform Lead</div>
            </div>
          </div>
        </aside>

        <div className="main">
          <main className="content">
            {activeTab === "dashboard" && (
              <section className="panel is-visible">
                <div className="page-head-dash">
                  <div>
                    <h1 className="title-dash-platform">Platform Overview</h1>
                  </div>
                  <button type="button" className="btn-new-ecoMission" onClick={() => setIsModalOpen(true)}>
                    <img src="/assets/icon-plus.svg" width="20" height="20" alt="" />
                    NEW ECOMISSION
                  </button>
                </div>

                <div className="stat-grid">
                  <article className="stat-card">
                    <div className="stat-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.0833 0 12.1083 0.158333 13.075 0.475C14.0417 0.791667 14.9333 1.23333 15.75 1.8L14.3 3.275C13.6667 2.875 12.9917 2.5625 12.275 2.3375C11.5583 2.1125 10.8 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 12.2167 2.77917 14.1042 4.3375 15.6625C5.89583 17.2208 7.78333 18 10 18C12.2167 18 14.1042 17.2208 15.6625 15.6625C17.2208 14.1042 18 12.2167 18 10C18 9.7 17.9833 9.4 17.95 9.1C17.9167 8.8 17.8667 8.50833 17.8 8.225L19.425 6.6C19.6083 7.13333 19.75 7.68333 19.85 8.25C19.95 8.81667 20 9.4 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM8.6 14.6L4.35 10.35L5.75 8.95L8.6 11.8L18.6 1.775L20 3.175L8.6 14.6Z" fill="#008b4e"/></svg></div>
                    <div className="delta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg> +12%</div>
                    <div className="label">Verified actions today</div>
                    <div className="value">{totalApproved.toLocaleString()}</div>
                  </article>
                  <article className="stat-card">
                    <div className="stat-icon"><svg width="18" height="20" viewBox="0 0 18 20" fill="none"><path d="M6.1 7.25L1.05 4.425L9 0L16.95 4.425L11.9 7.25C11.5167 6.85 11.075 6.54167 10.575 6.325C10.075 6.10833 9.55 6 9 6C8.45 6 7.925 6.10833 7.425 6.325C6.925 6.54167 6.48333 6.85 6.1 7.25ZM8 19.45L0 15V6.125L5.125 9C5.075 9.16667 5.04167 9.32917 5.025 9.4875C5.00833 9.64583 5 9.81667 5 10C5 10.9167 5.275 11.7333 5.825 12.45C6.375 13.1667 7.1 13.6417 8 13.875V19.45ZM9 12C8.45 12 7.97917 11.8042 7.5875 11.4125C7.19583 11.0208 7 10.55 7 10C7 9.45 7.19583 8.97917 7.5875 8.5875C7.97917 8.19583 8.45 8 9 8C9.55 8 10.0208 8.19583 10.4125 8.5875C10.8042 8.97917 11 9.45 11 10C11 10.55 10.8042 11.0208 10.4125 11.4125C10.0208 11.8042 9.55 12 9 12ZM10 19.45V13.875C10.9 13.6417 11.625 13.1667 12.175 12.45C12.725 11.7333 13 10.9167 13 10C13 9.81667 12.9917 9.64583 12.975 9.4875C12.9583 9.32917 12.925 9.16667 12.875 9L18 6.125V15L10 19.45Z" fill="#384C43"/></svg></div>
                    <div className="delta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg> +5.4%</div>
                    <div className="label">Total Leaves awarded today</div>
                    <div className="value">{totalCoinsAwarded.toLocaleString()}</div>
                  </article>
                  <article className="stat-card">
                    <div className="stat-icon"><svg width="22" height="16" viewBox="0 0 22 16" fill="none"><path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM18 16V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V16H18ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4Z" fill="#008b4e"/></svg></div>
                    <div className="delta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg> +28%</div>
                    <div className="label">Active students today</div>
                    <div className="value">{activeStudentsCount.toLocaleString()}</div>
                  </article>
                </div>

                <div className="two-col">
                  <div className="dash-feed-shell">
                    <div className="dash-feed-inner">
                      <div className="dash-feed-hd">
                        <div className="dash-feed-title">
                          <img src="/assets/Icon-12.svg" width="20" height="20" alt="" />
                          <h2>Real-time Live Activity</h2>
                        </div>
                      </div>
                      <div className="feed-rows">
                        {allSubmissions.slice(0, 20).map((sub) => (
                          <div key={sub.id} className="feed-row">
                            <div className="feed-avatar-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {sub.studentAvatar ? (
                                <img src={sub.studentAvatar} width="48" height="48" alt="" className="feed-avatar" />
                              ) : (
                                <div className="ini" style={{ width: 48, height: 48, fontSize: 16 }}>
                                  {sub.studentName?.charAt(0) || "S"}
                                </div>
                              )}
                              <div className={`feed-badge ${sub.verdict === "approved" ? "emerald" : "teal"}`} style={{ right: -2, bottom: -2 }}>
                                <img src="/assets/Icon-20.svg" width="10" height="10" alt="" className="ic-white" />
                              </div>
                            </div>
                            <div className="feed-body">
                              <div className="feed-line1">
                                <p className="msg"><strong>{sub.studentName || "Student"}</strong> {sub.verdict === "approved" ? "verified" : "submitted proof for"} <strong>{sub.ecoMissionTitle}</strong></p>
                                <span className="feed-time">2M AGO</span>
                              </div>
                              <div className="feed-line2">
                                <div className={`feed-coins ${sub.verdict === "flagged" ? "pending" : ""}`}>
                                  <img src={`/assets/Icon-${sub.verdict === "approved" ? "25" : "26"}.svg`} width="15" height="15" alt="" />
                                  {sub.verdict === "approved" ? `+${sub.coinsAwarded || 0} Leaves` : sub.verdict === "flagged" ? "Under Review" : "Rejected"}
                                </div>
                                <span className="feed-tag">SDG {sub.sdgNumber || "12"}: {sub.sdgNumber === 11 ? "Cities" : sub.sdgNumber === 12 ? "Consumption" : "Climate"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="feed-log-btn">VIEW HISTORICAL ACTIVITY LOG</button>
                    </div>
                  </div>

                  <div className="dash-col-right">
                    <div className="sdg-card-v2">
                      <div className="sdg-card-v2-hd">
                        <span>Ongoing EcoMissions Participation</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#404040" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                      {ecoMissions.filter(b => b.isActive).sort((a, b) => (b.claimCount || 0) - (a.claimCount || 0)).slice(0, 8).map((ecoMission, idx) => {
                        const count = ecoMission.claimCount || 0;
                        const max = Math.max(1, Math.max(...ecoMissions.map(b => b.claimCount || 0)));
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={ecoMission.id} className="sdg-bar-block">
                            <div className="bar-info">
                              <div className="name">{idx + 1}. {ecoMission.title}</div>
                              <div className="ct">{count} students</div>
                            </div>
                            <div className="sdg-track"><span style={{ width: `${Math.max(5, pct)}%`, background: 'var(--teal-800)' }}></span></div>
                          </div>
                        );
                      })}
                      <div className="sdg-card-v2-ft">Real-time engagement tracking</div>
                    </div>

                    <div className="sdg-card-v2 mt-8">
                      <div className="sdg-card-v2-hd">
                        <span>Top contributing SDGs</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#404040" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                      {[
                        { id: 12, name: "Responsible Consumption", color: "#064e3b" },
                        { id: 11, name: "Sustainable Cities", color: "#115e59" },
                        { id: 13, name: "Climate Action", color: "#065f46" }
                      ].map((sdg, idx) => {
                        const count = allSubmissions.filter(s => s.sdgNumber === sdg.id && s.verdict === "approved").length;
                        const max = Math.max(1, totalApproved);
                        const pct = Math.round((count / max) * 100);
                        return (
                          <div key={sdg.id} className="sdg-bar-block">
                            <div className="sdg-bar-labels">
                              <div className="name">{idx + 1}. SDG {sdg.id}: {sdg.name}</div>
                              <div className="ct">{count} actions</div>
                            </div>
                            <div className="sdg-track"><span style={{ width: `${Math.max(5, pct)}%`, background: sdg.color }}></span></div>
                          </div>
                        );
                      })}
                      <div className="sdg-card-v2-ft">Data refreshed in real-time</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "verifications" && (
              <section className="panel is-visible">
                <div className="page-head-dash">
                  <h1 className="title-dash-platform">Verification Queue</h1>
                </div>
                <div className="card ver-card">
                  <div className="card-hd">
                    <div className="hd-left">
                      <span className="hd-title">Pending Verification</span>
                      <span className="hd-count">({allSubmissions.filter(s => s.verdict === "flagged").length} Total)</span>
                    </div>
                  </div>
                  <div className="table-header-grid">
                    <div className="col-student">Student details</div>
                    <div className="col-ecoMission">EcoMission initiative</div>
                    <div className="col-actions">Actions</div>
                  </div>
                  <div className="table-scroll-wrap" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="data ver-table">
                      <colgroup>
                        <col style={{ width: "44%" }} />
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "16%" }} />
                      </colgroup>
                      <tbody>
                        {allSubmissions.filter(s => s.verdict === "flagged").map((sub, idx) => (
                          <tr key={sub.id} className={idx % 2 === 1 ? "row-alt" : ""}>
                            <td className="td-student">
                              <div className="student-cell">
                                {sub.studentAvatar ? (
                                  <img src={sub.studentAvatar} width="40" height="40" alt="" className="av-circle" />
                                ) : (
                                  <span className="ini">{(sub.studentName || "Student").substring(0, 2).toUpperCase()}</span>
                                )}
                                <div>
                                  <div className="nm">{sub.studentName || "Student"}</div>
                                  <div className="id">ID: #{sub.studentId?.substring(0, 8) || "N/A"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="td-ecoMission">
                              <div className="ecoMission-link-cell">
                                <img src="/assets/Icon-20.svg" width="12" height="12" alt="" />
                                <span className="ecoMission-nm">{sub.ecoMissionTitle || sub.bountyTitle || sub.title || "EcoMission"}</span>
                              </div>
                            </td>
                            <td className="td-actions">
                              <button type="button" className="btn-review" onClick={() => setSelectedSubmission(sub)}>
                                Review Proof
                                <img src="/assets/Icon-28.svg" width="12" height="12" alt="" className="ic-white" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="ver-mini-stats">
                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">AVG. CONFIDENCE</span>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/Icon-20.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val">
                      {allSubmissions.filter(s => s.verdict === "flagged").length > 0 
                        ? (allSubmissions.filter(s => s.verdict === "flagged").reduce((acc, s) => acc + (s.confidence || 0), 0) / allSubmissions.filter(s => s.verdict === "flagged").length).toFixed(1)
                        : "0.0"}%
                    </div>
                    <div className="meta">
                      <span className="chg-up">+2.4%</span>
                      <span className="sub-lbl">from last 24h</span>
                    </div>
                  </div>

                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">FLAGGED TODAY</span>
                      <div className="stat-icon-box red">
                        <img src="/assets/Icon-28.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val">{allSubmissions.filter(s => s.verdict === "flagged" && new Date(s.submittedAt).toDateString() === new Date().toDateString()).length}</div>
                    <div className="meta">
                      <span className="badge-red">Action Required</span>
                    </div>
                  </div>

                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">AI VERIFICATION ACCURACY</span>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/ui-icons/imp-circle.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val">
                      {allSubmissions.length > 0 
                        ? (allSubmissions.reduce((acc, s) => acc + (s.confidence || 0.94), 0) / allSubmissions.length * 100).toFixed(1)
                        : "94.2"}%
                    </div>
                    <div className="meta">
                      <span className="status-dot-green"></span>
                      <span className="sub-lbl">High-precision mode</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "leaderboard" && (
              <section className="panel is-visible">
                <div className="lb-head-row">
                  <div>
                    <h1 className="title-dash-platform">Eco-Leaderboard</h1>
                  </div>
                  <div className="lb-seg">
                    <button type="button" className="is-on">Weekly</button>
                    <button type="button">Monthly</button>
                    <button type="button">All-time</button>
                  </div>
                </div>

                {/* Podium Section */}
                <div className="lb-podium-row">
                  {/* 2nd Place */}
                  {leaderboard[1] && (
                    <div className="lb-card">
                      <div className="watermark">02</div>
                      <img src={leaderboard[1].photoURL || "/assets/avatar-david.png"} className="face" alt="" />
                      <div className="rank-dot stone">2</div>
                      <h3>{leaderboard[1].displayName}</h3>
                      <div className="coins-big">{leaderboard[1].points?.toLocaleString()}</div>
                      <div className="coins-sub">LEAVES</div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {leaderboard[0] && (
                    <div className="lb-card is-winner">
                      <div className="watermark">01</div>
                      <img src={leaderboard[0].photoURL || "/assets/avatar-david.png"} className="face" alt="" />
                      <div className="rank-dot">1</div>
                      <h3>{leaderboard[0].displayName}</h3>
                      <div className="coins-big">{leaderboard[0].points?.toLocaleString()}</div>
                      <div className="coins-sub">LEAVES</div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {leaderboard[2] && (
                    <div className="lb-card">
                      <div className="watermark">03</div>
                      <img src={leaderboard[2].photoURL || "/assets/avatar-david.png"} className="face" alt="" />
                      <div className="rank-dot amber">3</div>
                      <h3>{leaderboard[2].displayName}</h3>
                      <div className="coins-big">{leaderboard[2].points?.toLocaleString()}</div>
                      <div className="coins-sub">LEAVES</div>
                    </div>
                  )}
                </div>

                <div className="lb-rank-header">
                  <h2 className="title-dash-platform" style={{ fontSize: '28px' }}>Campus Ranking</h2>
                  <span className="lb-meta">SHOWING TOP 100 STUDENTS</span>
                </div>

                <div className="rank-table-wrap" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
                  <div className="rank-table-hd">
                    <div>Rank</div>
                    <div>Contributor</div>
                    <div>Total actions</div>
                    <div>Leaves</div>
                    <div>Progress</div>
                  </div>
                  <div className="rank-table-bd">
                    {leaderboard.slice(3).map((user, idx) => (
                      <div key={user.id} className={`rank-row ${idx % 2 === 1 ? "is-alt" : ""}`}>
                        <div className="rank-num">#{idx + 4}</div>
                        <div className="rank-user">
                          <img src={user.photoURL || "/assets/avatar-david.png"} width="40" height="40" alt="" />
                          <span className="nm">{user.displayName}</span>
                        </div>
                        <div className="rank-actions">{user.submissionsCount || 0} Actions</div>
                        <div className="rank-coins">{user.points?.toLocaleString()}</div>
                        <div className="rank-progress">
                          <div className="p-bar"><div className="p-fill" style={{ width: `${Math.min(100, (user.points / 6000) * 100)}%` }}></div></div>
                          <span className="p-pct">{Math.round(Math.min(100, (user.points / 6000) * 100))}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Impact Metrics */}
                <div className="ver-mini-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">TOTAL IMPACT VALUE</span>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/Icon-22.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val" style={{ color: '#064e3b' }}>Php 124.5k</div>
                  </div>

                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">ACTIVE CONTRIBUTORS</span>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/Icon-12.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val">1,204</div>
                    <div className="meta">
                      <span className="chg-up">+12% from last week</span>
                    </div>
                  </div>

                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">WASTE DIVERTED</span>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/Icon-15.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val">4.2 Tons</div>
                    <div className="meta">
                      <span className="chg-up">New Record!</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "export" && (
              <section className="panel is-visible">
                <div className="page-head-dash">
                  <div>
                    <h1 className="title-dash-platform">Sustainability Reports &amp; Exports</h1>
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="metric-grid mt-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="metric-card">
                    <span className="lbl">Waste Diverted</span>
                    <div className="val-row">
                      <span className="num">{wasteDiverted}</span>
                      <span className="unit">KG</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <span className="lbl">Total Impact Value</span>
                    <div className="val-row">
                      <span className="num">{totalImpactValue}</span>
                      <span className="unit">PTS</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <span className="lbl">Total Submissions</span>
                    <div className="val-row">
                      <span className="num">{allSubmissions.length}</span>
                      <span className="unit">FILES</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <span className="lbl">Approved Actions</span>
                    <div className="val-row">
                      <span className="num">{totalApproved}</span>
                      <span className="unit" style={{ color: 'var(--emerald-600)' }}>VERIFIED</span>
                    </div>
                  </div>
                </div>

                <div className="export-grid-v2 mt-8">
                  <div className="card export-main-card">
                    <div className="export-accent-line"></div>
                    <div className="export-content">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3>Sustainability Data Export</h3>
                            <button type="button" className="info-btn-v2" onClick={() => setInfoModal('export')}>i</button>
                          </div>
                        </div>
                        <div className="export-badge">AUDIT READY</div>
                      </div>
                      <div className="export-summary mt-6 mb-8">
                        <div className="summary-row">
                          <div className="item">
                            <span className="lbl">SDG COVERAGE</span>
                            <span className="val">{new Set(allSubmissions.filter(s => s.verdict === 'approved').map(s => s.sdgNumber)).size} Unique SDGs</span>
                          </div>
                          <div className="item">
                            <span className="lbl">AI CONFIDENCE</span>
                            <span className="val">{(allSubmissions.reduce((acc, s) => acc + (s.confidence || 0.94), 0) / (allSubmissions.length || 1) * 100).toFixed(1)}% Avg</span>
                          </div>
                          <div className="item">
                            <span className="lbl">AUDIT STATUS</span>
                            <span className="val">ISO Verified</span>
                          </div>
                        </div>
                      </div>
                      <div className="export-action-box">
                        <button type="button" className="btn-export-report" onClick={exportCsv}>
                          <span>Download CSV Report</span>
                          <img src="/assets/Icon-24.svg" width="20" height="20" alt="" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="gm-card-v2">
                    <div className="gm-v2-hd">
                      <div className="flex items-center gap-2">
                        <h3 className="gm-v2-title">GreenMetric Readiness</h3>
                        <button type="button" className="info-btn-v2" onClick={() => setInfoModal('greenmetric')}>i</button>
                      </div>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/Icon-22.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="gm-v2-pct-row">
                      <span className="gm-v2-big">{gmPct}%</span>
                      <span className="gm-v2-sub">Campus Data Integrity</span>
                    </div>
                    <div className="p-bar-v2">
                      <div className="p-fill" style={{ width: `${gmPct}%` }}></div>
                    </div>
                    <p className="gm-v2-copy">You are {Math.max(0, gmTarget - totalApproved).toLocaleString()} points from Platinum rating.</p>
                    <button type="button" className="gm-v2-cta" onClick={() => setShowRoadmap(true)}>View Certification Track</button>
                  </div>
                </div>

                {/* Impact Metrics */}
                <div className="ver-mini-stats mt-8" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">ENGAGEMENT VELOCITY</span>
                      <div className="stat-icon-box emerald">
                        <img src="/assets/Icon-18.svg" width="14" height="14" alt="" />
                      </div>
                    </div>
                    <div className="val">{(totalApproved / (activeStudentsCount || 1)).toFixed(1)}</div>
                    <p className="sub-lbl" style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>Actions per active student</p>
                  </div>

                  <div className="mini-card">
                    <div className="mini-hd">
                      <span className="lbl">PARTICIPATION RATE</span>
                    </div>
                    <div className="val">{Math.round((activeStudentsCount / 1000) * 100)}%</div>
                    <p className="sub-lbl" style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7 }}>Active vs Total population</p>
                  </div>

                  <div className="mini-card">
                    <div className="mini-hd">
                      <div className="flex items-center gap-2">
                        <span className="lbl">AUDIT STATUS</span>
                        <button type="button" className="info-btn-v2 sm" onClick={() => setInfoModal('audit')}>i</button>
                      </div>
                    </div>
                    <div className="val">Compliant</div>
                    <div className="meta">
                      <span className="chg-up">Passed on Apr 22</span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* New EcoMission Modal */}
      {isModalOpen && (
        <div className="modal-overlay is-open" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-hd">
              <div>
                <h3>Create New EcoMission</h3>
                <p>Design a sustainable challenge for the community.</p>
              </div>
              <button type="button" className="modal-x" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form className="modal-bd" onSubmit={handleCreateEcoMission}>
              <div className="nb-grid">
                <div className="field">
                  <label>EcoMission title</label>
                  <div className="control">
                    <input name="title" type="text" placeholder="e.g., Campus Cleanup Sprint" required />
                  </div>
                </div>
                <div className="field">
                  <label>Coins reward</label>
                  <div className="control">
                    <input name="coins" type="number" placeholder="500" required />
                  </div>
                </div>
                <div className="field">
                  <label>Type</label>
                  <div className="control">
                    <select name="type">
                      <option value="general">General</option>
                      <option value="reforestation">Reforestation</option>
                      <option value="energy">Energy</option>
                      <option value="waste">Waste</option>
                      <option value="water">Water</option>
                    </select>
                  </div>
                </div>
                <div className="field nb-row-span">
                  <label>Description</label>
                  <div className="control">
                    <textarea name="description" placeholder="Describe what participants should do..." required></textarea>
                  </div>
                </div>
              </div>
              <div className="nb-date">
                <div className="helper">Select SDG tags</div>
                <div className="date-cards">
                  {[11, 12, 13].map(num => (
                    <button 
                      key={num} 
                      type="button" 
                      className={`date-card ${newEcoMissionSdg === num ? "is-on" : ""}`} 
                      onClick={() => setNewEcoMissionSdg(num)}
                    >
                      <div className="day">{num}</div>
                      <div className="meta">
                        <div className="wk">SDG {num}</div>
                        <div className="cap">{num === 11 ? "Cities" : num === 12 ? "Consumption" : "Climate"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn-modal btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-modal btn-create">Create EcoMission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="modal-overlay is-open" onClick={() => setSelectedSubmission(null)}>
          <div className="modal review-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-hd">
              <div>
                <h3>Review Submission</h3>
                <p>{selectedSubmission.studentName} - {selectedSubmission.ecoMissionTitle}</p>
              </div>
              <button type="button" className="modal-x" onClick={() => setSelectedSubmission(null)}>&times;</button>
            </div>
            <div className="modal-bd">
              <div style={{ marginBottom: '20px' }}>
                <img src={selectedSubmission.photoUrl} alt="Submission" style={{ width: '100%', borderRadius: '12px', maxHeight: '400px', objectFit: 'contain', background: '#f4f4f5' }} />
              </div>
              <div className="nb-hint" style={{ marginBottom: '20px' }}>
                <div className="txt">
                  <strong>AI Reason:</strong>
                  <p>{selectedSubmission.reason || "No reason provided."}</p>
                </div>
              </div>
              <div className="field">
                <label>Admin Note (optional)</label>
                <div className="control">
                  <textarea 
                    placeholder="Explain why you are approving or rejecting..." 
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    style={{ minHeight: '80px' }}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-ft">
              <button type="button" className="btn-modal btn-cancel" onClick={() => setSelectedSubmission(null)}>Close</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn-modal" style={{ background: '#ef4444', color: 'white' }} onClick={handleReject}>Reject</button>
                <button type="button" className="btn-modal btn-create" onClick={handleApprove}>Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Info Modals */}
      {infoModal && (
        <div className="info-overlay-v2" onClick={() => setInfoModal(null)}>
          <div className="info-modal-v2" onClick={e => e.stopPropagation()}>
            <div className="info-modal-hd">
              <h3>
                {infoModal === 'export' && "Data Export Insights"}
                {infoModal === 'greenmetric' && "GreenMetric Standards"}
                {infoModal === 'audit' && "Audit Compliance Thresholds"}
              </h3>
              <button className="info-close" onClick={() => setInfoModal(null)}>&times;</button>
            </div>
            <div className="info-modal-body">
              {infoModal === 'export' && (
                <p>Generates an immutable audit trail of every student action. The report includes ISO 9001:2015 compliant data fields: SDG mapping, unique verification IDs, AI confidence scores, and raw photo evidence links.</p>
              )}
              {infoModal === 'greenmetric' && (
                <p>Measures the university's progress toward the UI GreenMetric 'Platinum' tier. Scoring is based on the volume of verified student participation in SDG 11, 12, and 13. Your current target is 5,000 approved actions per academic period.</p>
              )}
              {infoModal === 'audit' && (
                <div>
                  <p>Reflects the current data integrity status of the platform. To maintain 'Compliant' status, the system must meet these thresholds:</p>
                  <ul className="info-list">
                    <li><strong>Data Accuracy:</strong> &gt;95% average AI confidence score.</li>
                    <li><strong>Review Status:</strong> Zero unresolved 'Flagged' submissions.</li>
                    <li><strong>Proof Integrity:</strong> 100% of claims must have associated media proof.</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="info-modal-ft">
              <button className="info-got-it" onClick={() => setInfoModal(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}
      {/* Certification Roadmap Modal */}
      {showRoadmap && (
        <div className="info-overlay-v2" onClick={() => setShowRoadmap(false)}>
          <div className="roadmap-modal" onClick={e => e.stopPropagation()}>
            <div className="roadmap-hd">
              <div className="flex items-center gap-3">
                <div className="tier-badge silver">SILVER</div>
                <h3>Certification Roadmap</h3>
              </div>
              <button className="info-close" onClick={() => setShowRoadmap(false)}>&times;</button>
            </div>
            <div className="roadmap-body">
              <div className="roadmap-track">
                <div className="track-step is-done">
                  <div className="step-point"></div>
                  <div className="step-content">
                    <h4>Bronze Status</h4>
                    <p>Foundation sustainability metrics established.</p>
                    <span className="step-date">COMPLETED - SEPT 2025</span>
                  </div>
                </div>
                <div className="track-step is-active">
                  <div className="step-point"></div>
                  <div className="step-content">
                    <h4>Silver Status (Current)</h4>
                    <p>Live data tracking and AI verification active.</p>
                    <span className="step-status">IN PROGRESS - 84% READY</span>
                  </div>
                </div>
                <div className="track-step is-next">
                  <div className="step-point"></div>
                  <div className="step-content">
                    <h4>Gold Milestone</h4>
                    <p>Reach 10,000 verified student actions and 50% waste diversion.</p>
                    <div className="step-reqs">
                      <div className="req-item done">17/17 SDGs Tracked</div>
                      <div className="req-item">1,550 Actions Left</div>
                    </div>
                  </div>
                </div>
                <div className="track-step is-future">
                  <div className="step-point"></div>
                  <div className="step-content">
                    <h4>Platinum Rating</h4>
                    <p>Full campus circular economy integration.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="roadmap-ft">
              <button className="roadmap-btn-primary" onClick={() => setShowRoadmap(false)}>Close Roadmap</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        :root {
          --verde: #008b4e !important;
          --platform-title: #008b4e !important;
          --verde-dark: #006C48 !important;
        }
        .brand-title { color: #008b4e !important; }
        .stat-icon svg path { fill: #008b4e !important; }
        h1 { color: #008b4e !important; font-size: 42px !important; font-weight: 800 !important; letter-spacing: -0.03em !important; margin-bottom: 12px !important; }
        h2 { color: #008b4e !important; font-size: 32px !important; font-weight: 700 !important; letter-spacing: -0.02em !important; }
        .dash-feed-title h2 { font-size: 20px !important; }
        .ecoMission-nm { color: #1d242b !important; display: inline-block !important; margin-left: 8px !important; font-size: 13px !important; font-weight: 500 !important; white-space: nowrap !important; }
        .ecoMission-link-cell { display: flex !important; align-items: center !important; background: #f8fafc !important; padding: 6px 12px !important; rounded: 12px !important; border: 1px solid #e2e8f0 !important; width: fit-content !important; }
      `}</style>
    </>
  );
}
