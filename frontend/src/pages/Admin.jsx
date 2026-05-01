import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Upload, Edit, Trash2, ArrowLeft, Save, X } from 'lucide-react';

export default function Admin() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    language: 'JavaScript',
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
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get('/api/questions/all');
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/api/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleEdit = (q) => {
    setFormData({
      ...q,
      options: q.type === 'mcq' ? q.options.join(', ') : ''
    });
    setEditingId(q._id);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({
      language: 'JavaScript',
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
    try {
      const payload = {
        ...formData,
        options: formData.type === 'mcq' ? formData.options.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      if (editingId) {
        await axios.put(`/api/questions/${editingId}`, payload);
      } else {
        await axios.post('/api/questions', payload);
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err) {
      alert('Failed to save question');
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const bulkQuestions = results.data.map(row => ({
            language: row.language || 'JavaScript',
            difficulty: row.difficulty || 'Medium',
            type: row.type || 'mcq',
            code: row.code || '',
            options: row.type === 'fill_in_the_blank' ? [] : (row.options ? row.options.split(',').map(s => s.trim()) : []),
            correctAnswer: row.correctAnswer || '',
            explanation: row.explanation || ''
          }));

          const res = await axios.post('/api/questions/bulk', { questions: bulkQuestions });
          alert(res.data.message);
          fetchQuestions();
        } catch (err) {
          alert('Failed to upload bulk questions');
        }
      }
    });
    e.target.value = null; // reset
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-2">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Question Bank Admin</h1>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleCSVUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className="bg-dark-800 border border-dark-600 hover:bg-dark-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Upload size={18} /> Bulk CSV
          </button>
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg"
          >
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading questions...</div>
      ) : (
        <div className="glass-panel overflow-hidden rounded-xl border border-dark-600">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900 border-b border-dark-600 text-gray-400 uppercase">
                <tr>
                  <th className="p-4">Language</th>
                  <th className="p-4">Difficulty</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 w-1/3">Code Snippet</th>
                  <th className="p-4">Answer</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b border-dark-700 hover:bg-dark-800/50 transition">
                    <td className="p-4 font-bold text-primary-400">{q.language}</td>
                    <td className="p-4">{q.difficulty}</td>
                    <td className="p-4">{q.type === 'mcq' ? 'MCQ' : 'Fill Blank'}</td>
                    <td className="p-4 font-mono text-xs text-gray-300 truncate max-w-[200px]">{q.code}</td>
                    <td className="p-4 text-green-400">{q.correctAnswer}</td>
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleEdit(q)} className="p-2 bg-dark-700 hover:bg-blue-600 rounded text-gray-300 hover:text-white transition">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(q._id)} className="p-2 bg-dark-700 hover:bg-red-600 rounded text-gray-300 hover:text-white transition">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-dark-900 border border-dark-600 p-8 rounded-xl w-full max-w-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Language</label>
                  <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 focus:outline-none">
                    <option>JavaScript</option>
                    <option>Python</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
                  <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 focus:outline-none">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 focus:outline-none">
                    <option value="mcq">Multiple Choice</option>
                    <option value="fill_in_the_blank">Fill in the Blank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Code Snippet</label>
                <textarea required rows={4} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 font-mono focus:outline-none focus:border-blue-500" placeholder="print('Hello World')"></textarea>
              </div>

              {formData.type === 'mcq' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Options (comma separated)</label>
                  <input required type="text" value={formData.options} onChange={e => setFormData({...formData, options: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 focus:outline-none focus:border-blue-500" placeholder="Option 1, Option 2, Option 3, Option 4" />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Correct Answer (must perfectly match an option if MCQ)</label>
                <input required type="text" value={formData.correctAnswer} onChange={e => setFormData({...formData, correctAnswer: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 focus:outline-none focus:border-green-500" />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Explanation</label>
                <textarea rows={2} value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} className="w-full bg-dark-800 p-3 rounded-lg border border-dark-600 focus:outline-none focus:border-blue-500"></textarea>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2 mt-6">
                <Save size={20} /> Save Question
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
