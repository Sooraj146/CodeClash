import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Upload, Edit, Trash2, ArrowLeft, Save, X, Download, HelpCircle, AlertCircle, CheckCircle2, Lock, KeyRound, ChevronDown, ChevronRight, Code2, Globe, Coffee } from 'lucide-react';

/* ── Grouping helpers ──────────────────────────────────── */
const LANG_ORDER = ['Java', 'Python', 'Web'];
const DIFF_ORDER = ['Easy', 'Medium', 'Hard'];

const LANG_STYLE = {
  Java:   { bg: 'bg-[#1c1108]', text: 'text-orange-400', border: 'border-orange-500/40', icon: Coffee },
  Python: { bg: 'bg-[#0a1628]', text: 'text-blue-400',   border: 'border-blue-500/40',   icon: Code2  },
  Web:    { bg: 'bg-[#081a10]', text: 'text-green-400',  border: 'border-green-500/40',  icon: Globe  },
};

const DIFF_STYLE = {
  Easy:   { pill: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  Medium: { pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  Hard:   { pill: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

function groupQuestions(questions) {
  const map = {};
  for (const lang of LANG_ORDER) {
    map[lang] = { Easy: [], Medium: [], Hard: [] };
  }
  for (const q of questions) {
    const lang = LANG_ORDER.includes(q.language) ? q.language : 'Python';
    const diff = DIFF_ORDER.includes(q.difficulty) ? q.difficulty : 'Medium';
    map[lang][diff].push(q);
  }
  return map;
}

const EMPTY_FORM = {
  language: 'Python',
  difficulty: 'Medium',
  type: 'mcq',
  code: '',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correctAnswer: '',
  explanation: ''
};

export default function Admin() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showCSVHelp, setShowCSVHelp] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [collapsedLangs, setCollapsedLangs] = useState({});

  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) fetchQuestions();
  }, [isAuthenticated]);

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === 'McaAdmin') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Access denied.');
      setPassword('');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchQuestions = async () => {
    try {
      const res = await axios.get('/api/questions/all');
      setQuestions(res.data);
    } catch (err) {
      showMessage('error', 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/api/questions/${id}`);
      showMessage('success', 'Question deleted successfully');
      fetchQuestions();
    } catch (err) {
      showMessage('error', 'Failed to delete question');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`⚠️ DELETE ALL ${questions.length} QUESTIONS?\n\nThis cannot be undone. Are you absolutely sure?`)) return;
    try {
      const res = await axios.delete('/api/questions/all');
      showMessage('success', res.data.message);
      fetchQuestions();
    } catch (err) {
      showMessage('error', 'Failed to delete all questions');
    }
  };

  const handleEdit = (q) => {
    const [o1 = '', o2 = '', o3 = '', o4 = ''] = q.options || [];
    setFormData({
      language: q.language,
      difficulty: q.difficulty,
      type: q.type,
      code: q.code,
      option1: o1,
      option2: o2,
      option3: o3,
      option4: o4,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    });
    setEditingId(q._id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const buildOptions = () =>
    [formData.option1, formData.option2, formData.option3, formData.option4]
      .map(s => s.trim())
      .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const options = buildOptions();

    if (formData.type === 'mcq') {
      if (options.length < 2) {
        showMessage('error', 'Please fill in at least 2 options for MCQ');
        return;
      }
      if (!options.includes(formData.correctAnswer.trim())) {
        showMessage('error', 'Correct answer must exactly match one of the option fields');
        return;
      }
    }

    try {
      const payload = {
        language: formData.language,
        difficulty: formData.difficulty,
        type: formData.type,
        code: formData.code,
        options: formData.type === 'mcq' ? options : [],
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation
      };

      if (editingId) {
        await axios.put(`/api/questions/${editingId}`, payload);
        showMessage('success', 'Question updated successfully');
      } else {
        await axios.post('/api/questions', payload);
        showMessage('success', 'Question added successfully');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err) {
      showMessage('error', 'Failed to save question');
    }
  };

  // CSV uses pipe "|" as the option delimiter so commas inside options are safe
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => h.trim(),
      complete: async (results) => {
        try {
          const bulkQuestions = results.data
            .filter(row => row.code && row.correctAnswer)
            .map(row => ({
              language: (row.language || 'Python').trim(),
              difficulty: (row.difficulty || 'Medium').trim(),
              type: (row.type || 'mcq').trim(),
              code: (row.code || '').trim(),
              // Pipe-separated options — safe for options that contain commas
              options: (row.type || '').trim() === 'fill_in_the_blank'
                ? []
                : (row.options ? row.options.split('|').map(s => s.trim()).filter(Boolean) : []),
              correctAnswer: (row.correctAnswer || '').trim(),
              explanation: (row.explanation || '').trim()
            }));

          if (bulkQuestions.some(q => !q.correctAnswer)) {
            throw new Error('Validation failed: some questions are missing a correctAnswer.');
          }

          const res = await axios.post('/api/questions/bulk', { questions: bulkQuestions });
          showMessage('success', res.data.message);
          fetchQuestions();
        } catch (err) {
          showMessage('error', err.response?.data?.message || err.message || 'Bulk upload failed');
        }
      }
    });
    e.target.value = null;
  };

  const downloadSampleCSV = () => {
    // Demonstrates pipe-separated options — including a tricky list option
    const rows = [
      'language,difficulty,type,code,options,correctAnswer,explanation',
      'Python,Easy,mcq,"print(type([]))","<class \'list\'>|<class \'array\'>|<type \'list\'>|None","<class \'list\'>","type([]) in Python 3 is <class \'list\'>"',
      'Python,Medium,mcq,"a = [0,1,2]\nprint(a[0:2])","[0]|[0, 1]|[0, 1, 2]|Error","[0, 1]","Slicing a[0:2] returns elements at index 0 and 1."',
      'Python,Easy,fill_in_the_blank,"What keyword is used to define a function in Python?",,def,"The def keyword is used to define functions in Python."',
      'Python,Hard,mcq,"def f(x=[]):\n    x.append(1)\n    return x\nprint(f())\nprint(f())","[1]\n[1]|[1]\n[1, 1]|[1, 1]\n[1, 1]|Error","[1]\n[1, 1]","Default mutable arguments are shared across calls."'
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_questions.csv';
    link.click();
  };

  const field = (key, label, props = {}) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <input
        type="text"
        value={formData[key]}
        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
        className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition"
        {...props}
      />
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="glass-panel p-10 w-full max-w-md border-dark-600 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-500 mb-4"><Lock size={40} /></div>
              <h2 className="text-3xl font-bold mb-2">Admin Access</h2>
              <p className="text-gray-400">Enter the administrator password to manage the question bank.</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-600 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center tracking-widest font-mono"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              {authError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  <AlertCircle size={16} /><span>{authError}</span>
                </div>
              )}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg">Unlock Panel</button>
              <button type="button" onClick={() => navigate('/dashboard')} className="w-full text-gray-500 hover:text-white transition-colors text-sm font-medium">Back to Dashboard</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Toast */}
          {message.text && (
            <div className={`fixed top-20 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${message.type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'} text-white`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-medium">{message.text}</p>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-2">
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Question Bank Admin</h1>
              <p className="text-gray-400 text-sm mt-1">Manage coding challenges and quizzes</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowCSVHelp(!showCSVHelp)} className="bg-dark-800 border border-dark-600 hover:border-blue-500/50 px-4 py-2 rounded-lg flex items-center gap-2 transition text-gray-300">
                <HelpCircle size={18} /> CSV Format
              </button>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="bg-dark-800 border border-dark-600 hover:bg-dark-700 px-4 py-2 rounded-lg flex items-center gap-2 transition text-gray-300">
                <Upload size={18} /> Bulk CSV
              </button>
              <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg">
                <Plus size={18} /> Add Question
              </button>
              {questions.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg border border-red-500/50"
                  title="Permanently delete every question in the bank"
                >
                  <Trash2 size={18} /> Delete All
                </button>
              )}
            </div>
          </div>

          {/* CSV Help */}
          {showCSVHelp && (
            <div className="glass-panel mb-8 p-6 border-blue-500/30 bg-blue-500/5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-400"><Upload size={20} /> CSV Upload Instructions</h3>
                <button onClick={downloadSampleCSV} className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-md flex items-center gap-2 transition border border-blue-500/30">
                  <Download size={14} /> Download Sample
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-4">Required headers: <code className="text-blue-300">language, difficulty, type, code, options, correctAnswer, explanation</code></p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <ul className="space-y-2">
                  <li><code className="text-blue-400">language</code>: Python, Java, Web</li>
                  <li><code className="text-blue-400">difficulty</code>: Easy, Medium, Hard</li>
                  <li><code className="text-blue-400">type</code>: mcq, fill_in_the_blank</li>
                </ul>
                <ul className="space-y-2">
                  <li><code className="text-blue-400">options</code>: Separated by <code className="text-yellow-400 font-bold">|</code> (pipe). Allows commas inside options safely.</li>
                  <li><code className="text-blue-400">correctAnswer</code>: Must exactly match one option</li>
                  <li><code className="text-blue-400">code</code>: Wrap in double quotes if multi-line</li>
                </ul>
              </div>
              <div className="mt-4 bg-dark-900 rounded-lg p-3 border border-dark-600 text-xs font-mono text-gray-400 overflow-x-auto">
                <span className="text-yellow-400">⚠ Options use pipe | as separator:</span><br />
                Python,Medium,mcq,"a=[0,1,2]\nprint(a[0:2])","[0]|[0, 1]|[0, 1, 2]|Error","[0, 1]","a[0:2] returns indices 0 and 1"
              </div>
            </div>
          )}

          {/* Question Bank — grouped by Language → Difficulty */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p>Loading question bank...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="glass-panel p-16 text-center text-gray-500 rounded-xl border border-dark-600">
              No questions found. Add some or upload a CSV to get started!
            </div>
          ) : (() => {
            const grouped = groupQuestions(questions);
            const total = questions.length;
            return (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                  <span className="font-semibold text-white text-lg">{total}</span> questions total
                  {LANG_ORDER.map(lang => {
                    const count = DIFF_ORDER.reduce((s, d) => s + grouped[lang][d].length, 0);
                    if (!count) return null;
                    const ls = LANG_STYLE[lang];
                    return <span key={lang} className={`px-2 py-0.5 rounded-full text-xs font-bold ${ls.bg} ${ls.text}`}>{lang}: {count}</span>;
                  })}
                </div>

                {LANG_ORDER.map(lang => {
                  const ls = LANG_STYLE[lang];
                  const LangIcon = ls.icon;
                  const langTotal = DIFF_ORDER.reduce((s, d) => s + grouped[lang][d].length, 0);
                  if (!langTotal) return null;
                  const isCollapsed = collapsedLangs[lang];

                  return (
                    <div key={lang} className={`rounded-2xl border ${ls.border} overflow-hidden bg-[#0e1420]`}>
                      {/* Language header — click to collapse */}
                      <button
                        onClick={() => setCollapsedLangs(p => ({ ...p, [lang]: !p[lang] }))}
                        className={`w-full flex items-center justify-between px-6 py-4 ${ls.bg} hover:brightness-110 transition`}
                      >
                        <div className="flex items-center gap-3">
                          <LangIcon size={20} className={ls.text} />
                          <span className={`text-lg font-bold ${ls.text}`}>{lang}</span>
                          <span className="text-xs text-gray-400 font-normal">{langTotal} question{langTotal !== 1 ? 's' : ''}</span>
                        </div>
                        {isCollapsed ? <ChevronRight size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                      </button>

                      {!isCollapsed && (
                        <div className="bg-[#111827] divide-y divide-[#1f2d45]">
                          {DIFF_ORDER.map(diff => {
                            const qs = grouped[lang][diff];
                            if (!qs.length) return null;
                            const ds = DIFF_STYLE[diff];
                            return (
                              <div key={diff}>
                                {/* Difficulty sub-header */}
                                <div className="flex items-center gap-3 px-6 py-2 bg-[#1c2235] border-b border-[#2a3147]">
                                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${ds.pill}`}>{diff}</span>
                                  <span className="text-xs text-gray-500">{qs.length} question{qs.length !== 1 ? 's' : ''}</span>
                                </div>
                                {/* Question cards */}
                                <div className="divide-y divide-dark-700/30">
                                  {qs.map((q, idx) => (
                                    <div key={q._id} className="flex items-start gap-4 px-6 py-4 hover:bg-[#1c2235] transition group">
                                      <span className="text-xs text-gray-600 font-mono mt-1 w-5 shrink-0">{idx + 1}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-mono text-xs text-gray-200 bg-[#0e1118] p-3 rounded-lg border border-[#2a3147] truncate mb-2">{q.code}</div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                          <span className="text-gray-500">{q.type === 'mcq' ? 'MCQ' : 'Fill-in-blank'}</span>
                                          <span className="text-gray-600">·</span>
                                          <span className="text-gray-500">Answer:</span>
                                          <code className="text-green-400 bg-green-400/5 px-2 py-0.5 rounded border border-green-400/10 max-w-[200px] truncate">{q.correctAnswer}</code>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={() => handleEdit(q)} className="p-2 bg-dark-700 hover:bg-blue-600 rounded-lg text-gray-400 hover:text-white transition" title="Edit"><Edit size={15} /></button>
                                        <button onClick={() => handleDelete(q._id)} className="p-2 bg-dark-700 hover:bg-red-600 rounded-lg text-gray-400 hover:text-white transition" title="Delete"><Trash2 size={15} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}


          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
              <div className="bg-dark-900 border border-dark-600 p-8 rounded-2xl w-full max-w-2xl my-auto shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">{editingId ? 'Edit Question' : 'New Question'}</h2>
                    <p className="text-gray-400 text-sm">Fill in the details for the quiz question</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition p-2 hover:bg-dark-800 rounded-full"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Row 1: language / difficulty / type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Language</label>
                      <select value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition cursor-pointer">
                        <option>Python</option><option>Java</option><option>Web</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                      <select value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition cursor-pointer">
                        <option>Easy</option><option>Medium</option><option>Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                      <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition cursor-pointer">
                        <option value="mcq">Multiple Choice</option>
                        <option value="fill_in_the_blank">Fill in the Blank</option>
                      </select>
                    </div>
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Code Snippet / Question Text</label>
                    <textarea required rows={4} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full bg-dark-950 p-4 rounded-xl border border-dark-600 font-mono text-sm focus:outline-none focus:border-blue-500 transition resize-none" placeholder="function hello() { ... }"></textarea>
                  </div>

                  {/* Options — 4 separate input fields for MCQ */}
                  {formData.type === 'mcq' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Options <span className="text-gray-600 normal-case font-normal">(each in its own field — commas inside are fine)</span></label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['option1', 'option2', 'option3', 'option4'].map((key, i) => (
                          <div key={key} className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{String.fromCharCode(65 + i)}.</span>
                            <input
                              type="text"
                              value={formData[key]}
                              onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                              required={i < 2}
                              className="w-full bg-dark-800 pl-8 pr-4 py-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition text-sm"
                              placeholder={`Option ${String.fromCharCode(65 + i)}${i < 2 ? ' (required)' : ' (optional)'}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-gray-600 text-[10px]">At least 2 options required. The correct answer must exactly match one of the above.</p>
                    </div>
                  )}

                  {/* Correct Answer + Explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Correct Answer</label>
                      <input required type="text" value={formData.correctAnswer} onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })} className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-green-500 transition" placeholder={formData.type === 'mcq' ? 'Must exactly match an option' : 'The exact answer'} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Explanation (Optional)</label>
                      <input type="text" value={formData.explanation} onChange={e => setFormData({ ...formData, explanation: e.target.value })} className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition" placeholder="Brief explanation of the answer" />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-dark-800 hover:bg-dark-700 text-white font-bold py-4 rounded-xl transition border border-dark-600">Cancel</button>
                    <button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                      <Save size={20} /> {editingId ? 'Update Question' : 'Save Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
