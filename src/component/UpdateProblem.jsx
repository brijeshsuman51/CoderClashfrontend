import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from 'zod';
import axiosClient from "../utils/axiosClient";
import { logoutUser } from '../authSlice';

// Reuse the same schema from CreateProblem
const problemSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z.enum(['array', 'linkedList', 'graph']),
    visibleTestCases: z.array(
        z.object({
            input: z.string().min(1, "Input is required"),
            output: z.string().min(1, "Output is required"),
            explanation: z.string().min(1, "Explanation is required")
        })
    ).min(1, "Minimum one visible test case is required"),
    hiddenTestCases: z.array(
        z.object({
            input: z.string().min(1, "Input is required"),
            output: z.string().min(1, "Output is required"),
        })
    ).min(1, "Minimum one hidden test case is required"),
    startCode: z.array(
        z.object({
            language: z.enum(['C++', 'Java', "JavaScript"]),
            initialCode: z.string().min(1, "Initial code is required")
        })
    ).length(3, "All three languages are required for initial code"),
    referenceSolution: z.array(
        z.object({
            language: z.enum(["C++", "Java", "JavaScript"]),
            completeCode: z.string().min(1, "Complete Code is required")
        })
    ).length(3, "All three languages are required for reference solution")
});

function UpdateProblem() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { problemId } = useParams();
    const { user } = useSelector((state) => state.auth);
    const [problems, setProblems] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filters, setFilters] = useState({
        difficulty: 'all',
        tag: 'all'
    });

    const languages = ["C++", "Java", "JavaScript"];
    
    const defaultCodeTemplates = {
        startCode: languages.map(lang => ({
            language: lang,
            initialCode: `// ${lang} starter code`
        })),
        referenceSolution: languages.map(lang => ({
            language: lang,
            completeCode: `// ${lang} solution`
        }))
    };

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue
    } = useForm({
        resolver: zodResolver(problemSchema),
        defaultValues: {
            title: '',
            description: '',
            difficulty: 'easy',
            tags: 'array',
            visibleTestCases: [{ input: 'Sample input', output: 'Sample output', explanation: 'Sample explanation' }],
            hiddenTestCases: [{ input: 'Hidden input', output: 'Hidden output' }],
            startCode: defaultCodeTemplates.startCode,
            referenceSolution: defaultCodeTemplates.referenceSolution
        }
    });

    const {
        fields: visibleFields,
        append: appendVisible,
        remove: removeVisible
    } = useFieldArray({
        control,
        name: 'visibleTestCases'
    });

    const {
        fields: hiddenFields,
        append: appendHidden,
        remove: removeHidden
    } = useFieldArray({
        control,
        name: 'hiddenTestCases'
    });

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const { data } = await axiosClient.get('/problem/getAllProblem');
                setProblems(Array.isArray(data) ? data : data?.problems || []);
            } catch (error) {
                console.error("Error fetching Problems:", error);
                setProblems([]);
            }
        };

        fetchProblems();
    }, []);

    useEffect(() => {
        if (problemId) {
            const fetchProblemDetails = async () => {
                setLoading(true);
                try {
                    const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);
                    // console.log(data)
                    setSelectedProblem(data);
                    
                    // Set language values explicitly
                    const formattedData = {
                        title: data?.title || '',
                        description: data?.description || '',
                        difficulty: data?.difficulty || 'easy',
                        tags: data?.tags || 'array',
                        visibleTestCases: data?.visibleTestCases,
                        hiddenTestCases: data?.hiddenTestCases, 
                        startCode: data?.startCode || defaultCodeTemplates.startCode,
                        referenceSolution: data?.referenceSolution || defaultCodeTemplates.referenceSolution
                    };
                    
                    // Reset form with fetched data
                    reset(formattedData);
                    
                    // Manually set language values to ensure they're correct
                    languages.forEach((lang, index) => {
                        setValue(`startCode.${index}.language`, lang);
                        setValue(`referenceSolution.${index}.language`, lang);
                    });
                    
                } catch (error) {
                    console.error("Error fetching problem details:", error);
                    alert("Failed to load problem details");
                    navigate('/admin/update'); 
                } finally {
                    setLoading(false);
                }
            };

            fetchProblemDetails();
        }
    }, [problemId, reset, navigate]);

    const handleLogout = () => {
        dispatch(logoutUser());
    };

    const filterProblems = (Array.isArray(problems) ? problems : []).filter(problem => {
        const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
        const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
        return difficultyMatch && tagMatch;
    });

    const getDifficultyBadgeColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'badge-success';
            case 'medium': return 'badge-warning';
            case 'hard': return 'badge-error';
            default: return 'badge-neutral';
        }
    };

    const onSubmit = async (data) => {
        setSubmitting(true);
        console.log("Form data submitted:", data);
        
        try {
            const response = await axiosClient.put(`/problem/update/${problemId}`, data);
            console.log("Update response:", response.data);
            alert("Problem updated successfully!");
            navigate("/");
        } catch (error) {
            console.error("Error updating problem:", error);
            alert(`Error: ${error.response?.data?.message || error.message || "An unknown error occurred"}`);
        } finally {
            setSubmitting(false);
        }
    };

    // If no problem is selected, show the list of problems
    if (!problemId) {
        return (
            <div className="min-h-screen bg-base-200">
                <nav className="navbar bg-base-100 shadow-lg px-4">
                    <div className="flex-1">
                        <NavLink to="/" className="btn btn-ghost text-xl">CoderClash</NavLink>
                    </div>

                    <div className="flex-none gap-4">
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost m-1">
                                {user?.firstName}
                            </div>
                            <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                                <li><button onClick={handleLogout}>Logout</button></li>
                                {user?.role === 'admin' && <li><NavLink to="/admin">Admin</NavLink></li>}
                            </ul>
                        </div>
                    </div>
                </nav>

                <div className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6">Select a Problem to Update</h1>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                        <select
                            className="select select-bordered"
                            value={filters.difficulty}
                            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>

                        <select
                            className="select select-bordered"
                            value={filters.tag}
                            onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                        >
                            <option value="all">All Tags</option>
                            <option value="array">Array</option>
                            <option value="linkedList">Linked List</option>
                            <option value="graph">Graph</option>
                        </select>
                    </div>

                    <div className="grid gap-4">
                        {filterProblems.map(problem => (
                            <div key={problem?._id} className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <div className="flex items-center justify-between">
                                        <h2 className="card-title">
                                            {problem?.title}
                                        </h2>
                                        <NavLink 
                                            to={`/admin/update/${problem?._id}`}
                                            className="btn btn-primary"
                                        >
                                            Update
                                        </NavLink>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className={`badge ${getDifficultyBadgeColor(problem?.difficulty)}`}>
                                            {problem?.difficulty}
                                        </div>
                                        <div className="badge badge-info">
                                            {problem?.tags}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // If a problem is selected, show the update form
    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Update Problem: {selectedProblem?.title}</h1>
                <button 
                    className="btn btn-secondary"
                    onClick={() => navigate('/admin/update')}
                >
                    Back to Problems List
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {Object.keys(errors).length > 0 && (
                    <div role="alert" className="alert alert-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <span className="font-bold">Please fix the following errors:</span>
                            <ul className="list-disc list-inside mt-1">
                                {errors.title && <li>Title: {errors.title.message}</li>}
                                {errors.description && <li>Description: {errors.description.message}</li>}
                                {errors.difficulty && <li>Difficulty: {errors.difficulty.message}</li>}
                                {errors.tags && <li>Tags: {errors.tags.message}</li>}
                                {errors.visibleTestCases && <li>Visible Test Cases: {errors.visibleTestCases.message}</li>}
                                {errors.hiddenTestCases && <li>Hidden Test Cases: {errors.hiddenTestCases.message}</li>}
                                {errors.startCode && <li>Start Code: {errors.startCode.message}</li>}
                                {errors.referenceSolution && <li>Reference Solution: {errors.referenceSolution.message}</li>}
                                
                                {/* Show language-specific errors */}
                                {errors.startCode && errors.startCode[0]?.language && (
                                    <li>Start Code Language: {errors.startCode[0].language.message}</li>
                                )}
                                {errors.referenceSolution && errors.referenceSolution[0]?.language && (
                                    <li>Reference Solution Language: {errors.referenceSolution[0].language.message}</li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                <div className="card bg-base-100 shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Title</span>
                            </label>
                            <input
                                {...register('title')}
                                className={`input input-bordered ${errors.title ? 'input-error' : ''}`}
                            />
                            {errors.title && (
                                <span className="text-error text-sm">{errors.title.message}</span>
                            )}
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Description</span>
                            </label>
                            <textarea
                                {...register('description')}
                                className={`textarea textarea-bordered h-32 ${errors.description ? 'textarea-error' : ''}`}
                            />
                            {errors.description && (
                                <span className="text-error text-sm">{errors.description.message}</span>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <div className="form-control w-1/2">
                                <label className="label">
                                    <span className="label-text">Difficulty</span>
                                </label>
                                <select
                                    {...register('difficulty')}
                                    className={`select select-bordered ${errors.difficulty ? 'select-error' : ''}`}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                                {errors.difficulty && (
                                    <span className="text-error text-sm">{errors.difficulty.message}</span>
                                )}
                            </div>

                            <div className="form-control w-1/2">
                                <label className="label">
                                    <span className="label-text">Tags</span>
                                </label>
                                <select
                                    {...register('tags')}
                                    className={`select select-bordered ${errors.tags ? 'select-error' : ''}`}
                                >
                                    <option value="array">Array</option>
                                    <option value="linkedList">LinkedList</option>
                                    <option value="graph">Graph</option>
                                </select>
                                {errors.tags && (
                                    <span className="text-error text-sm">{errors.tags.message}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
                    
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Visible Test Cases</h3>
                            <button
                                type="button"
                                onClick={() => appendVisible({ input: 'Sample input', output: 'Sample output', explanation: 'Sample explanation' })}
                                className="btn btn-sm btn-primary"
                            >
                                Add Visible Case
                            </button>
                        </div>

                        {visibleFields.map((field, index) => (
                            <div key={field.id} className="border p-4 rounded-lg space-y-2">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeVisible(index)}
                                        className="btn btn-xs btn-error"
                                        disabled={visibleFields.length <= 1}
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Input</span>
                                    </label>
                                    <input
                                        {...register(`visibleTestCases.${index}.input`)}
                                        className={`input input-bordered w-full ${errors.visibleTestCases?.[index]?.input ? 'input-error' : ''}`}
                                    />
                                    {errors.visibleTestCases?.[index]?.input && (
                                        <span className="text-error text-sm">{errors.visibleTestCases[index].input.message}</span>
                                    )}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Output</span>
                                    </label>
                                    <input
                                        {...register(`visibleTestCases.${index}.output`)}
                                        className={`input input-bordered w-full ${errors.visibleTestCases?.[index]?.output ? 'input-error' : ''}`}
                                    />
                                    {errors.visibleTestCases?.[index]?.output && (
                                        <span className="text-error text-sm">{errors.visibleTestCases[index].output.message}</span>
                                    )}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Explanation</span>
                                    </label>
                                    <textarea
                                        {...register(`visibleTestCases.${index}.explanation`)}
                                        className={`textarea textarea-bordered w-full ${errors.visibleTestCases?.[index]?.explanation ? 'textarea-error' : ''}`}
                                    />
                                    {errors.visibleTestCases?.[index]?.explanation && (
                                        <span className="text-error text-sm">{errors.visibleTestCases[index].explanation.message}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Hidden Test Cases</h3>
                            <button
                                type="button"
                                onClick={() => appendHidden({ input: 'Hidden input', output: 'Hidden output' })}
                                className="btn btn-sm btn-primary"
                            >
                                Add Hidden Case
                            </button>
                        </div>

                        {hiddenFields.map((field, index) => (
                            <div key={field.id} className="border p-4 rounded-lg space-y-2">
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeHidden(index)}
                                        className="btn btn-xs btn-error"
                                        disabled={hiddenFields.length <= 1}
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Input</span>
                                    </label>
                                    <input
                                        {...register(`hiddenTestCases.${index}.input`)}
                                        className={`input input-bordered w-full ${errors.hiddenTestCases?.[index]?.input ? 'input-error' : ''}`}
                                    />
                                    {errors.hiddenTestCases?.[index]?.input && (
                                        <span className="text-error text-sm">{errors.hiddenTestCases[index].input.message}</span>
                                    )}
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Output</span>
                                    </label>
                                    <input
                                        {...register(`hiddenTestCases.${index}.output`)}
                                        className={`input input-bordered w-full ${errors.hiddenTestCases?.[index]?.output ? 'input-error' : ''}`}
                                    />
                                    {errors.hiddenTestCases?.[index]?.output && (
                                        <span className="text-error text-sm">{errors.hiddenTestCases[index].output.message}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card bg-base-100 shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Code Templates</h2>

                    <div className="space-y-6">
                        {languages.map((language, index) => (
                            <div key={index} className="space-y-2">
                                <h3 className="font-mono text-lg font-semibold mb-2">
                                    {language}
                                </h3>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Initial Code</span>
                                    </label>
                                    <input
                                        type="hidden"
                                        value={language}
                                        {...register(`startCode.${index}.language`)}
                                    />
                                    <textarea
                                        {...register(`startCode.${index}.initialCode`)}
                                        className={`w-full textarea textarea-bordered font-mono ${errors.startCode?.[index]?.initialCode ? 'textarea-error' : ''}`}
                                        rows={6}
                                    />
                                    {errors.startCode?.[index]?.initialCode && (
                                        <span className="text-error text-sm mt-1">{errors.startCode[index].initialCode.message}</span>
                                    )}
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Complete Code</span>
                                    </label>
                                    <input
                                        type="hidden"
                                        value={language}
                                        {...register(`referenceSolution.${index}.language`)}
                                    />
                                    <textarea
                                        {...register(`referenceSolution.${index}.completeCode`)}
                                        className={`w-full textarea textarea-bordered font-mono ${errors.referenceSolution?.[index]?.completeCode ? 'textarea-error' : ''}`}
                                        rows={6}
                                    />
                                    {errors.referenceSolution?.[index]?.completeCode && (
                                        <span className="text-error text-sm mt-1">{errors.referenceSolution[index].completeCode.message}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <span className="loading loading-spinner"></span>
                            Updating...
                        </>
                    ) : "Update Problem"}
                </button>
            </form>
        </div>
    );
}

export default UpdateProblem;