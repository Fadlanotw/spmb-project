"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock3, Flag } from "lucide-react";
import StudentShell from "../StudentShell";
import styles from "./page.module.css";

const EXAM_DURATION_SECONDS = 60 * 60;
const STORAGE_KEY = "spmb-exam-deadline";
const ANSWERS_KEY = "spmb-exam-answers";
const MARKED_KEY = "spmb-exam-marked";

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export default function TesCalonSiswaPage() {
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [showConfirm, setShowConfirm] = useState(false);
  const autoSubmitStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/soal-ujian")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Gagal memuat soal.");
        if (!cancelled) setData(payload);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!data?.aktif || !data.questions.length) return;
    const savedDeadline = Number(window.sessionStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(savedDeadline) && savedDeadline > 0) {
      setDeadline(savedDeadline);
      setSecondsLeft(Math.max(0, Math.ceil((savedDeadline - Date.now()) / 1000)));
      try {
        setAnswers(JSON.parse(window.sessionStorage.getItem(ANSWERS_KEY) || "{}"));
        setMarked(JSON.parse(window.sessionStorage.getItem(MARKED_KEY) || "[]"));
      } catch {
        window.sessionStorage.removeItem(ANSWERS_KEY);
        window.sessionStorage.removeItem(MARKED_KEY);
      }
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(ANSWERS_KEY);
      window.sessionStorage.removeItem(MARKED_KEY);
    }
  }, [data]);

  useEffect(() => {
    if (!deadline || result) return;
    window.sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    window.sessionStorage.setItem(MARKED_KEY, JSON.stringify(marked));
  }, [answers, deadline, marked, result]);

  const submitTest = useCallback(async () => {
    if (submitting || result) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/soal-ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawaban: answers }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Jawaban gagal dikumpulkan.");
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(ANSWERS_KEY);
      window.sessionStorage.removeItem(MARKED_KEY);
      setResult(payload);
      setShowConfirm(false);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }, [answers, result, submitting]);

  useEffect(() => {
    if (!deadline || result) return undefined;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0 && !autoSubmitStarted.current) {
        autoSubmitStarted.current = true;
        submitTest();
      }
    };
    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(intervalId);
  }, [deadline, result, submitTest]);

  const currentQuestion = data?.questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const unansweredCount = (data?.totalSoal || 0) - answeredCount;
  const isTimeLow = secondsLeft <= 5 * 60;

  function startTest() {
    const newDeadline = Date.now() + EXAM_DURATION_SECONDS * 1000;
    window.sessionStorage.setItem(STORAGE_KEY, String(newDeadline));
    window.sessionStorage.removeItem(ANSWERS_KEY);
    window.sessionStorage.removeItem(MARKED_KEY);
    setAnswers({});
    setMarked([]);
    setSecondsLeft(EXAM_DURATION_SECONDS);
    setDeadline(newDeadline);
  }

  function toggleMarked() {
    if (!currentQuestion) return;
    setMarked((current) => current.includes(currentQuestion.id)
      ? current.filter((id) => id !== currentQuestion.id)
      : [...current, currentQuestion.id]);
  }

  function confirmSubmit() {
    setShowConfirm(false);
    submitTest();
  }

  return (
    <StudentShell title="Tes Seleksi">
    <div className={styles.page}>
      <div className={styles.top}>
        <Link className={styles.back} href="/dashboard/calon-siswa">← Kembali ke dashboard</Link>
        <p className={styles.eyebrow}>SPMB GARUDA UTAMA · TES SELEKSI</p>
        <h1>Ujian Potensi Akademik</h1>
        <p className={styles.intro}>Kerjakan setiap soal dan periksa kembali jawaban sebelum ujian dikumpulkan.</p>
      </div>

      {loading ? (
        <p className={styles.notice}>Memuat soal ujian...</p>
      ) : error && !data ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : !data?.aktif ? (
        <section className={styles.notice}>
          <h2>Tes belum tersedia</h2>
          <p>Soal akan muncul di halaman ini setelah admin mengaktifkan ujian.</p>
        </section>
      ) : result ? (
        <section className={styles.result} aria-live="polite">
          <span className={styles.resultIcon}><Check size={24} /></span>
          <h2>Ujian berhasil dikumpulkan</h2>
          <p>Nilai Anda</p>
          <strong>{result.nilai}</strong>
          <span>{result.benar} dari {result.totalSoal} soal dijawab benar.</span>
          <Link className={styles.backResult} href="/dashboard/calon-siswa">Kembali ke dashboard</Link>
        </section>
      ) : !deadline ? (
        <section className={styles.instructions}>
          <div className={styles.instructionTitle}>
            <Clock3 size={20} />
            <h2>Petunjuk Ujian</h2>
          </div>
          <ul>
            <li>Ujian terdiri dari <strong>{data.totalSoal} soal</strong> pilihan ganda.</li>
            <li>Waktu pengerjaan adalah <strong>60 menit</strong> dan mulai dihitung setelah tombol mulai ditekan.</li>
            <li>Jawaban dapat diubah selama ujian berlangsung. Gunakan tanda ragu untuk meninjau soal kembali.</li>
            <li>Ujian akan dikumpulkan otomatis saat waktu habis. Jawaban yang belum diisi akan dinilai salah.</li>
          </ul>
          <button type="button" className={styles.startButton} onClick={startTest}>Mulai Ujian</button>
        </section>
      ) : (
        <section className={styles.exam}>
          <div className={styles.examHeader}>
            <div>
              <span className={styles.examLabel}>UJIAN SEDANG BERLANGSUNG</span>
              <p>{answeredCount} dari {data.totalSoal} soal telah dijawab</p>
            </div>
            <div className={`${styles.timer} ${isTimeLow ? styles.timerLow : ""}`} aria-live="polite">
              <Clock3 size={18} />
              <span>{formatTime(secondsLeft)}</span>
            </div>
          </div>
          <div className={styles.progressTrack} aria-label={`${answeredCount} dari ${data.totalSoal} soal terjawab`}>
            <span style={{ width: `${data.totalSoal ? (answeredCount / data.totalSoal) * 100 : 0}%` }} />
          </div>

          <div className={styles.examBody}>
            <div className={styles.questionPanel}>
              <div className={styles.questionMeta}>
                <span>Soal {currentIndex + 1} dari {data.totalSoal}</span>
                <span>{currentQuestion?.kategori}</span>
              </div>
              <h2>{currentQuestion?.pertanyaan}</h2>
              <div className={styles.options}>
                {Object.entries(currentQuestion?.opsi || {}).map(([key, value]) => (
                  <label className={`${styles.option} ${answers[currentQuestion.id] === key ? styles.selected : ""}`} key={key}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={key}
                      checked={answers[currentQuestion.id] === key}
                      onChange={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: key }))}
                    />
                    <span className={styles.optionLetter}>{key}</span>
                    <span>{value}</span>
                  </label>
                ))}
              </div>
              <div className={styles.questionActions}>
                <button type="button" className={`${styles.markButton} ${marked.includes(currentQuestion?.id) ? styles.marked : ""}`} onClick={toggleMarked}>
                  <Flag size={15} />
                  {marked.includes(currentQuestion?.id) ? "Hapus tanda ragu" : "Tandai untuk ditinjau"}
                </button>
                <div className={styles.paging}>
                  <button type="button" className={styles.pageButton} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0}>
                    <ChevronLeft size={17} /> Sebelumnya
                  </button>
                  {currentIndex < data.totalSoal - 1 ? (
                    <button type="button" className={styles.nextButton} onClick={() => setCurrentIndex((index) => Math.min(data.totalSoal - 1, index + 1))}>
                      Berikutnya <ChevronRight size={17} />
                    </button>
                  ) : (
                    <button type="button" className={styles.nextButton} onClick={() => setShowConfirm(true)}>
                      Selesaikan Ujian
                    </button>
                  )}
                </div>
              </div>
            </div>

            <aside className={styles.navigator}>
              <h3>Navigasi Soal</h3>
              <p>Klik nomor untuk berpindah soal.</p>
              <div className={styles.numberGrid}>
                {data.questions.map((question, index) => (
                  <button
                    type="button"
                    key={question.id}
                    className={[
                      styles.numberButton,
                      answers[question.id] ? styles.numberAnswered : "",
                      marked.includes(question.id) ? styles.numberMarked : "",
                      index === currentIndex ? styles.numberCurrent : "",
                    ].filter(Boolean).join(" ")}
                    aria-label={`Soal ${index + 1}${answers[question.id] ? ", sudah dijawab" : ", belum dijawab"}${marked.includes(question.id) ? ", ditandai ragu" : ""}`}
                    aria-current={index === currentIndex ? "step" : undefined}
                    onClick={() => setCurrentIndex(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className={styles.legend}>
                <span><i className={styles.legendAnswered} /> Sudah dijawab</span>
                <span><i className={styles.legendMarked} /> Ragu-ragu</span>
                <span><i className={styles.legendEmpty} /> Belum dijawab</span>
              </div>
              <button type="button" className={styles.submitButton} onClick={() => setShowConfirm(true)} disabled={submitting}>
                Kumpulkan Ujian
              </button>
            </aside>
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </section>
      )}

      {showConfirm && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <span className={styles.warningIcon}><AlertTriangle size={22} /></span>
            <h2 id="confirm-title">Kumpulkan ujian sekarang?</h2>
            <p>
              {unansweredCount > 0
                ? `Masih ada ${unansweredCount} soal yang belum dijawab. Soal tersebut akan dinilai salah.`
                : "Semua soal sudah dijawab. Pastikan jawaban Anda sudah benar."}
            </p>
            <div className={styles.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setShowConfirm(false)}>Periksa Kembali</button>
              <button type="button" className={styles.confirmButton} onClick={confirmSubmit} disabled={submitting}>
                {submitting ? "Mengumpulkan..." : "Ya, Kumpulkan"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
    </StudentShell>
  );
}
