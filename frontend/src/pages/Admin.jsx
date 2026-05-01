import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Upload, Edit, Trash2, ArrowLeft, Save, X, Download, HelpCircle, AlertCircle, CheckCircle2, Lock, KeyRound } from 'lucide-react';

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
  
  const [formData, setFormData] = useState({
    language: 'Python',
    difficulty: 'Medium',
    type: 'mcq',
    code: '',
    options: '',
    correctAnswer: '',
    explanation: ''
  });

  const fileInputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuestions();
    }
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
      console.error(err);
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

  const handleEdit = (q) => {
    setFormData({
      language: q.language,
      difficulty: q.difficulty,
      type: q.type,
      code: q.code,
      options: q.type === 'mcq' ? q.options.join(', ') : '',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    });
    setEditingId(q._id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      language: 'Python',
      difficulty: 'Medium',
      type: 'mcq',
      code: '',
      options: '',
      correctAnswer: '',
      explanation: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.type === 'mcq' && !formData.options.includes(formData.correctAnswer)) {
      showMessage('error', 'Correct answer must be one of the options for MCQ');
      return;
    }

    try {
      const payload = {
        ...formData,
        options: formData.type === 'mcq' ? formData.options.split(',').map(s => s.trim()).filter(Boolean) : []
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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        try {
          console.log('Parsed CSV Results:', results.data); // Debugging
          const bulkQuestions = results.data
            .filter(row => row.language || row.code || row.correctAnswer) // Skip rows that are mostly empty
            .map(row => ({
              language: (row.language || 'Python').trim(),
              difficulty: (row.difficulty || 'Medium').trim(),
              type: (row.type || 'mcq').trim(),
              code: (row.code || '').trim(),
              options: (row.type || '').trim() === 'fill_in_the_blank' ? [] : (row.options ? row.options.split(',').map(s => s.trim()).filter(Boolean) : []),
              correctAnswer: (row.correctAnswer || '').trim(),
              explanation: (row.explanation || '').trim()
            }));
          
          if (bulkQuestions.some(q => !q.correctAnswer)) {
            const missing = bulkQuestions.filter(q => !q.correctAnswer);
            console.error('Questions missing correctAnswer:', missing);
            throw new Error(`Validation failed: ${missing.length} questions are missing a correct answer.`);
          }

          const res = await axios.post('/api/questions/bulk', { questions: bulkQuestions });
          showMessage('success', res.data.message);
          fetchQuestions();
        } catch (err) {
          console.error('Bulk upload error:', err.response?.data || err.message);
          showMessage('error', err.response?.data?.message || 'Failed to upload bulk questions');
        }
      }
    });
    e.target.value = null; // reset
  };

  const downloadSampleCSV = () => {
    const csvContent = "language,difficulty,type,code,options,correctAnswer,explanation\n" +
      "Python,Easy,mcq,\"print(type([]))\",\"list,array,null,undefined\",list,Lists are a built-in type in Python\n" +
      "Web,Medium,fill_in_the_blank,\"<div class='container'></div>\",,div,Standard HTML div element";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_questions.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
          <div className="glass-panel p-10 w-full max-w-md border-dark-600 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-500 mb-4 shadow-inner">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl font-bold mb-2">Admin Access</h2>
              <p className="text-gray-400">Please enter the administrator password to manage the question bank.</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-500 transition-colors">
                  <KeyRound size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-950 border border-dark-600 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center tracking-widest font-mono"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 animate-shake">
                  <AlertCircle size={16} />
                  <span>{authError}</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                Unlock Panel
              </button>

              <button 
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full text-gray-500 hover:text-white transition-colors text-sm font-medium"
              >
                Back to Dashboard
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Toast Message */}
      {message.text && (
        <div className={`fixed top-20 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-green-600/90 text-white' : 'bg-red-600/90 text-white'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-2">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Question Bank Admin
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage coding challenges and quizzes</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setShowCSVHelp(!showCSVHelp)}
            className="bg-dark-800 border border-dark-600 hover:border-blue-500/50 px-4 py-2 rounded-lg flex items-center gap-2 transition text-gray-300"
          >
            <HelpCircle size={18} /> CSV Format
          </button>
          
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleCSVUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-dark-800 border border-dark-600 hover:bg-dark-700 px-4 py-2 rounded-lg flex items-center gap-2 transition text-gray-300"
          >
            <Upload size={18} /> Bulk CSV
          </button>
          
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-blue-900/20"
          >
            <Plus size={18} /> Add Question
          </button>
        </div>
      </div>

      {/* CSV Help Section */}
      {showCSVHelp && (
        <div className="glass-panel mb-8 p-6 border-blue-500/30 bg-blue-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-400">
              <Upload size={20} /> CSV Upload Instructions
            </h3>
            <button onClick={downloadSampleCSV} className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-md flex items-center gap-2 transition border border-blue-500/30">
              <Download size={14} /> Download Sample
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4">Your CSV file should have the following headers exactly:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><code className="text-blue-400">language</code>: JavaScript, Python, etc.</li>
              <li className="flex gap-2"><code className="text-blue-400">difficulty</code>: Easy, Medium, Hard</li>
              <li className="flex gap-2"><code className="text-blue-400">type</code>: mcq, fill_in_the_blank</li>
            </ul>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><code className="text-blue-400">options</code>: Comma-separated list (for MCQ only)</li>
              <li className="flex gap-2"><code className="text-blue-400">correctAnswer</code>: Exact string match</li>
              <li className="flex gap-2"><code className="text-blue-400">code</code>: Use double quotes for code snippets</li>
            </ul>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading question bank...</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-xl border border-dark-600">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-950 border-b border-dark-600 text-gray-400 font-semibold">
                <tr>
                  <th className="p-4">Topic</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 w-1/3">Preview</th>
                  <th className="p-4">Correct Answer</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-500">No questions found. Add some to get started!</td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q._id} className="hover:bg-dark-800/40 transition group">
                      <td className="p-4">
                        <span className="bg-primary-500/10 text-primary-400 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                          {q.language}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
                          q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">
                        {q.type === 'mcq' ? 'Multiple Choice' : 'Fill-in-blank'}
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs text-gray-300 truncate max-w-[300px] bg-dark-900/50 p-2 rounded border border-dark-700/50">
                          {q.code}
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="text-green-400 bg-green-400/5 px-2 py-1 rounded border border-green-400/10">{q.correctAnswer}</code>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(q)} 
                            className="p-2 bg-dark-700 hover:bg-blue-600 rounded-lg text-gray-400 hover:text-white transition shadow-sm"
                            title="Edit Question"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(q._id)} 
                            className="p-2 bg-dark-700 hover:bg-red-600 rounded-lg text-gray-400 hover:text-white transition shadow-sm"
                            title="Delete Question"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-dark-900 border border-dark-600 p-8 rounded-2xl w-full max-w-2xl my-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold">{editingId ? 'Edit Question' : 'New Question'}</h2>
                <p className="text-gray-400 text-sm">Fill in the details for the quiz question</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition p-2 hover:bg-dark-800 rounded-full">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Language</label>
                  <select 
                    value={formData.language} 
                    onChange={e => setFormData({...formData, language: e.target.value})} 
                    className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option>Python</option>
                    <option>Java</option>
                    <option>Web</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Difficulty</label>
                  <select 
                    value={formData.difficulty} 
                    onChange={e => setFormData({...formData, difficulty: e.target.value})} 
                    className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})} 
                    className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="mcq">Multiple Choice</option>
                    <option value="fill_in_the_blank">Fill in the Blank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Code Snippet / Question Text</label>
                <textarea 
                  required 
                  rows={4} 
                  value={formData.code} 
                  onChange={e => setFormData({...formData, code: e.target.value})} 
                  className="w-full bg-dark-950 p-4 rounded-xl border border-dark-600 font-mono text-sm focus:outline-none focus:border-blue-500 transition resize-none" 
                  placeholder="function hello() { ... }"
                ></textarea>
              </div>

              {formData.type === 'mcq' && (
                <div className="animate-in slide-in-from-left-2 duration-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Options (comma separated)</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.options} 
                    onChange={e => setFormData({...formData, options: e.target.value})} 
                    className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="Option A, Option B, Option C, Option D" 
                  />
                  <p className="text-gray-500 text-[10px] mt-2">Make sure the correct answer is one of these options exactly.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Correct Answer</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.correctAnswer} 
                    onChange={e => setFormData({...formData, correctAnswer: e.target.value})} 
                    className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-green-500 transition" 
                    placeholder={formData.type === 'mcq' ? 'Must match one option' : 'The exact answer'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Explanation (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.explanation} 
                    onChange={e => setFormData({...formData, explanation: e.target.value})} 
                    className="w-full bg-dark-800 p-3 rounded-xl border border-dark-600 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="Brief explanation of the answer"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-dark-800 hover:bg-dark-700 text-white font-bold py-4 rounded-xl transition border border-dark-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                >
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
