'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { formatDistanceToNow, format } from 'date-fns';
import Image from 'next/image';

interface Message {
    id: string;
    content: string;
    emoji: string;
    done: boolean;
    createdAt: string;
    expectedResponse?: string;
}

interface Person {
    name: string;
    slug: string;
    messages: Message[];
}

interface User {
    name?: string | null;
    username?: string | null;
}

export default function DashboardClient({ }: { user: User }) {
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
    const [name, setName] = useState('');
    const [showMarkDoneModal, setShowMarkDoneModal] = useState(false);
    const [messageToMarkDone, setMessageToMarkDone] = useState<Message | null>(null);
    const [currentPersonSlugForMessageAction, setCurrentPersonSlugForMessageAction] = useState<string | null>(null);
    const [isCreatingPerson, setIsCreatingPerson] = useState(false);
    const [isDeletingPerson, setIsDeletingPerson] = useState(false);
    const [isMarkingMessageDone, setIsMarkingMessageDone] = useState(false);
    const [expandedDoneSections, setExpandedDoneSections] = useState<Record<string, boolean>>({});
    const [copiedLinkSlug, setCopiedLinkSlug] = useState<string | null>(null);

    useEffect(() => {
        const fetchPersons = async () => {
            const res = await fetch('/api/person');
            if (res.ok) {
                const data = await res.json();
                if (data.person) {
                    const personData = Array.isArray(data.person) ? data.person : [data.person];
                    const normalizedPersons: Person[] = personData.map((person: Omit<Person, 'messages'> & { messages?: Message[] }) => ({
                        ...person,
                        messages: person.messages || []
                    }));
                    setPersons(normalizedPersons);
                } else {
                    setPersons([]);
                }
            } else {
                console.error("Failed to fetch persons");
                setPersons([]);
            }
            setLoading(false);
        };
        fetchPersons();
    }, []);

    const handleCreate = async () => {
        setIsCreatingPerson(true);
        try {
            const res = await fetch('/api/person', {
                method: 'POST',
                body: JSON.stringify({ name }),
                headers: { 'Content-Type': 'application/json' },
            });

            if (res.ok) {
                const data = await res.json();
                const newPerson = {
                    ...data.person,
                    messages: data.person.messages || []
                };
                setPersons([...persons, newPerson]);
                setShowModal(false);
                setName('');
            }
        } catch (error) {
            console.error("Error creating person:", error);
        } finally {
            setIsCreatingPerson(false);
        }
    };

    const handleDelete = async (person: Person) => {
        setPersonToDelete(person);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!personToDelete) return;

        setIsDeletingPerson(true);
        try {
            const res = await fetch(`/api/person?slug=${personToDelete.slug}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setPersons(persons.filter(p => p.slug !== personToDelete.slug));
                setShowDeleteModal(false);
                setPersonToDelete(null);
            } else {
                console.error("Failed to delete person");
            }
        } catch (error) {
            console.error("Error deleting person:", error);
        } finally {
            setIsDeletingPerson(false);
        }
    };

    const handleMarkMessageDone = (message: Message, personSlug: string) => {
        setMessageToMarkDone(message);
        setCurrentPersonSlugForMessageAction(personSlug);
        setShowMarkDoneModal(true);
    };

    const confirmMarkMessageDone = async () => {
        if (!messageToMarkDone || !currentPersonSlugForMessageAction) return;

        setIsMarkingMessageDone(true);
        try {
            const res = await fetch(`/api/message?id=${messageToMarkDone.id}`, {
                method: 'PATCH',
            });

            if (res.ok) {
                setPersons(prevPersons =>
                    prevPersons.map(person =>
                        person.slug === currentPersonSlugForMessageAction
                            ? {
                                ...person,
                                messages: person.messages.map(msg =>
                                    msg.id === messageToMarkDone.id
                                        ? { ...msg, done: true }
                                        : msg
                                ),
                            }
                            : person
                    )
                );
                setShowMarkDoneModal(false);
                setMessageToMarkDone(null);
                setCurrentPersonSlugForMessageAction(null);
            } else {
                console.error("Failed to mark message as done");
            }
        } catch (error) {
            console.error("Error marking message as done:", error);
        } finally {
            setIsMarkingMessageDone(false);
        }
    };

    const toggleDoneSection = (personSlug: string) => {
        setExpandedDoneSections(prev => ({
            ...prev,
            [personSlug]: !prev[personSlug]
        }));
    };

    const handleCopyLink = async (slug: string) => {
        const link = `${process.env.NEXT_PUBLIC_BASE_URL}/share/${slug}`;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(link);
                setCopiedLinkSlug(slug);
                setTimeout(() => setCopiedLinkSlug(null), 3000);
                return;
            }

            const textArea = document.createElement('textarea');
            textArea.value = link;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                setCopiedLinkSlug(slug);
                setTimeout(() => setCopiedLinkSlug(null), 3000);
            } else {
                alert(`Please copy this link manually: ${link}`);
            }
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert(`Please copy this link manually: ${link}`);
        }
    };

    const emojiOptions = [
        { value: 'crying', file: 'crying.svg', alt: 'Crying face' },
        { value: 'dead', file: 'dead.svg', alt: 'Dead face' },
        { value: 'frown', file: 'frown.svg', alt: 'Frown face' },
        { value: 'happy-open', file: 'happy-open.svg', alt: 'Happy face' },
        { value: 'love-eyes', file: 'love-eyes.svg', alt: 'Love eyes face' },
        { value: 'puppy-face', file: 'puppy-face.svg', alt: 'Puppy face' },
        { value: 'sad', file: 'sad.svg', alt: 'Sad face' },
        { value: 'satisfied', file: 'satisfied.svg', alt: 'Satisfied face' },
        { value: 'smile', file: 'smile.svg', alt: 'Smile face' },
        { value: 'surprised', file: 'surprised.svg', alt: 'Surprised face' },
        { value: 'wailing', file: 'wailing.svg', alt: 'Wailing face' },
        { value: 'wink', file: 'wink.svg', alt: 'Wink face' },
    ];

    const getEmojiFile = (emojiValue: string): string => {
        return emojiOptions.find(emoji => emoji.value === emojiValue)?.file || 'smile.svg';
    };


    if (loading) return <div className="min-h-screen w-full flex items-center justify-center">
        <Image
            src="/heart.svg"
            width={100}
            height={100}
            alt="Heart Logo"
            className="animate-heartbeat"
        />
    </div>;

    return (
        <div>
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-4xl font-playfair text-red-400 font-semibold">The Baddie:</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-red-200 flex hover:cursor-pointer items-center gap-4 py-3 px-4 sm:px-10 border-2 border-black text-black font-lexend text-2xl font-medium hover:shadow-[10px_10px_0px_0px_rgba(0,0,0)] transition duration-200"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M18 2H12V3.99995H10.0002V9.99995H12.0002V4H18V2ZM18 10H12V12H18V10ZM18.0002 3.99995H20.0002V9.99995H18.0002V3.99995ZM7 15.9999H9V14H21V16H9V20H21.0002V15.9999H23.0002V21.9999H23V22H7V21.9999V20V15.9999ZM3 8H5V10H7V12H5V14H3V12H1V10H3V8Z" fill="black" />
                        </svg>
                        <span className="hidden sm:inline">Add girlfriend</span>
                    </button>
                </div>

                {persons.length === 0 ? (
                    <p className="text-gray-500 mb-6">You haven&apos;t added any girlfriend yet.</p>
                ) : (
                    <div className="space-y-8">
                        {persons.map(person => {
                            const activeMessages = person.messages.filter(msg => !msg.done);
                            const doneMessages = person.messages.filter(msg => msg.done);
                            const isDoneSectionExpanded = expandedDoneSections[person.slug] || false;

                            return (
                                <div key={person.slug} className="border-2 p-4">
                                    <div className="mb-3 flex justify-between items-center">
                                        <div>
                                            <div className='flex items-center justify-start gap-3'>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M9 2H5V4H3V6H1V12H3V14H5V16H7V18H9V20H11V22H13V20H15V18H17V16H19V14H21V12H23V6H21V4H19V2H15V4H13V6H11V4H9V2ZM9 4V6H11V8H13V6H15V4H19V6H21V12H19V14H17V16H15V18H13V20H11V18H9V16H7V14H5V12H3V6H5V4H9Z" fill="black" />
                                                </svg>
                                                <p className="text-3xl font-semibold text-gray-800 font-playfair">{person.name}</p>
                                            </div>
                                            <p className="text-gray-700 font-lexend text-md mt-2">
                                                Complaint link:{' '}
                                                <button
                                                    onClick={() => handleCopyLink(person.slug)}
                                                    className="bg-gray-100 px-2 hover:bg-gray-200 hover:cursor-pointer transition-colors text-md rounded"
                                                >
                                                    {copiedLinkSlug === person.slug ? (
                                                        <span className="text-green-600">Copied to clipboard!</span>
                                                    ) : (
                                                        <code className="text-left font-mono">{`${process.env.NEXT_PUBLIC_BASE_URL}/share/${person.slug}`}</code>
                                                    )}
                                                </button>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(person)}
                                            className='hover:cursor-pointer hover:scale-110 transition-transform duration-200 mr-4'
                                        >
                                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2H18V4H12.0002V9.99995H10.0002V3.99995H12V2ZM12 10H18V12H12V10ZM20.0002 3.99995H18.0002V9.99995H20.0002V3.99995ZM9 15.9999H7V20V21.9999V22H23V21.9999H23.0002V15.9999H21.0002V20H9V16H21V14H9V15.9999ZM7 10H1V12H7V10Z" fill="black" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="mt-4">
                                        {activeMessages.length > 0 && (
                                            <h4 className="text-xl font-lexend font-medium text-gray-700 mb-4">This is how deep in the water you are:</h4>
                                        )}
                                        {activeMessages.length === 0 ? (
                                            <p className="text-gray-500 text-sm">It&apos;s so peaceful here. For now!</p>
                                        ) : (
                                            <ul className="space-y-4 sm:space-y-2">
                                                {activeMessages.map((msg) => (
                                                    <li
                                                        key={msg.id}
                                                        className="font-lexend flex flex-col md:flex-row sm:items-start gap-x-3 gap-y-2"
                                                    >
                                                        <div className="flex-grow w-full mt-3 sm:mt-0">
                                                            <div className="border-2 p-3 bg-red-100">
                                                                <div className="flex items-center">
                                                                    {msg.emoji && (
                                                                        <div className="w-20 h-14 relative">
                                                                            <Image
                                                                                src={`/emoticons/${getEmojiFile(msg.emoji)}`}
                                                                                alt={`${msg.emoji}`}
                                                                                fill
                                                                                className="object-contain"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <span className="ml-6 text-lg">{msg.content}</span>
                                                                </div>
                                                                <div className='flex flex-col-reverse md:flex-row-reverse justify-between items-start md:items-end'>
                                                                    <div className="text-right text-xs text-gray-500 mt-3 self-end">
                                                                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                                                    </div>
                                                                    {msg.expectedResponse && (
                                                                        <div className="mt-4 font-lexend flex items-center gap-3 bg-neutral-100 p-2 border-l-4 border-emerald-400">
                                                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path fillRule="evenodd" clipRule="evenodd" d="M10 2H14V6H10V2ZM7 7H17V9H15V16V22H13V16H11V22H9V16V9H7V7ZM5 5V7H7V5H5ZM5 5H3V3H5V5ZM19 5V7H17V5H19ZM19 5V3H21V5H19Z" fill="black" />
                                                                            </svg>
                                                                            <div>
                                                                                <p className="text-md font-medium text-gray-700">Expected Response:</p>
                                                                                <p className="text-lg">{msg.expectedResponse}</p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => handleMarkMessageDone(msg, person.slug)}
                                                            className="flex-shrink-0 flex items-center justify-center gap-2 w-full md:w-auto px-4 py-3 bg-red-200 border-2 hover:cursor-pointer shadow-[5px_5px_0px_0px_rgba(0,0,0)] font-lexend text-xl font-medium hover:shadow-[10px_10px_0px_0px_rgba(0,0,0)] transition duration-200"
                                                            title="Mark Resolved"
                                                            disabled={isMarkingMessageDone && messageToMarkDone?.id === msg.id}
                                                        >
                                                            {isMarkingMessageDone && messageToMarkDone?.id === msg.id ? (
                                                                <svg width="24" height="24" className='animate-spin' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>
                                                            ) : (
                                                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path fillRule="evenodd" clipRule="evenodd" d="M15 6H17V8H15V6ZM13 10V8H15V10H13ZM11 12V10H13V12H11ZM9 14V12H11V14H9ZM7 16V14H9V16H7ZM5 16H7V18H5V16ZM3 14H5V16H3V14ZM3 14H1V12H3V14ZM11 16H13V18H11V16ZM15 14V16H13V14H15ZM17 12V14H15V12H17ZM19 10V12H17V10H19ZM21 8H19V10H21V8ZM21 8H23V6H21V8Z" fill="black" />
                                                                </svg>
                                                            )}
                                                            {isMarkingMessageDone && messageToMarkDone?.id === msg.id ? "Resolving..." : "Resolve"}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {doneMessages.length > 0 && (
                                        <div className="mt-6 border-t pt-4">
                                            <button
                                                onClick={() => toggleDoneSection(person.slug)}
                                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-lexend hover:cursor-pointer"
                                            >
                                                <svg width="24" height="24" className={`transform transition-transform ${isDoneSectionExpanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M8 5L8 7L10 7L10 5L8 5ZM12 9L12 7L10 7L10 9L12 9ZM14 11L14 9L12 9L12 11L14 11ZM14 13L16 13L16 11L14 11L14 13ZM12 15L12 13L14 13L14 15L12 15ZM12 15L10 15L10 17L12 17L12 15ZM8 19L8 17L10 17L10 19L8 19Z" fill="black" />
                                                </svg>
                                                <span>Resolved Issues ({doneMessages.length})</span>
                                            </button>

                                            {isDoneSectionExpanded && (
                                                <ul className="space-y-2 mt-3 pl-6">
                                                    {doneMessages.map((msg) => (
                                                        <li
                                                            key={msg.id}
                                                            className="flex gap-2 items-center font-lexend"
                                                        >
                                                            <div className="flex-grow border-2 p-3 bg-gray-100 opacity-70">
                                                                <div className="flex items-center gap-4">
                                                                    {msg.emoji && (
                                                                        <div className="w-12 h-10 relative flex-shrink-0">
                                                                            <Image
                                                                                src={`/emoticons/${getEmojiFile(msg.emoji)}`}
                                                                                alt={`${msg.emoji} emoji`}
                                                                                fill
                                                                                className="object-contain opacity-50"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <span className="text-gray-700">{msg.content}</span>
                                                                </div>
                                                                {msg.expectedResponse && (
                                                                    <div className="mt-2 bg-white p-2 border-l-4 border-gray-300">
                                                                        <p className="text-sm font-medium text-gray-500">Expected Response:</p>
                                                                        <p className="text-gray-500">{msg.expectedResponse}</p>
                                                                    </div>
                                                                )}
                                                                <div className="text-right text-xs text-gray-500 mt-2">
                                                                    Marked as resolved · {format(new Date(msg.createdAt), 'MMM d, yyyy HH:mm')}
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white border-2 p-6 space-y-4">
                            <div className='flex items-center justify-between mb-8'>
                                <h2 className="text-3xl font-playfair">What&apos;s her name?</h2>
                                <Image
                                    src="/emoticons/love-eyes.svg"
                                    width={60}
                                    height={30}
                                    alt="Heart Logo"
                                />
                            </div>
                            <input
                                type="text"
                                className="border px-3 py-2 w-96"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="pookie, sweetheart, etc."
                                maxLength={24}
                            />
                            <div className="flex justify-between items-center mt-12">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-200 border-2 cursor-pointer font-lexend text-xl font-medium hover:shadow-[5px_5px_0px_0px_rgba(0,0,0)] transition duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className={`px-4 py-2 flex items-center gap-4 hover:cursor-pointer bg-red-200 border-2 ${!name.trim() || name.length > 24 || isCreatingPerson
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'shadow-[5px_5px_0px_0px_rgba(0,0,0)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0)]'
                                        } font-lexend text-xl font-medium transition duration-200`}
                                    disabled={!name.trim() || name.length > 24 || isCreatingPerson}
                                >
                                    {isCreatingPerson ? (
                                        <svg width="24" height="24" className='animate-spin' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12.9999 2H10.9999V8H12.9999V2ZM12.9999 16H10.9999V22H12.9999V16ZM21.9998 11V13L15.9998 13V11H21.9998ZM7.99963 13V11H1.99963V13L7.99963 13ZM14.9996 6.99997H16.9996V8.99997H14.9996V6.99997ZM18.9995 4.99997H16.9995V6.99997H18.9995V4.99997ZM8.99963 6.99997H6.99963V8.99997H8.99963V6.99997ZM4.99973 4.99997H6.99973V6.99997H4.99973V4.99997ZM14.9996 17H16.9995V18.9999H18.9995V16.9999H16.9996V15H14.9996V17ZM6.99963 16.9999V15H8.99963V17H6.99973V18.9999H4.99973V16.9999H6.99963Z" fill="black" />
                                        </svg>
                                    ) : (
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M23 9V10H22V11H21V12H20V13H19V14H17V13H16V12H15V11H16V10H17V11H19V10H20V9H21V8H22V9H23Z" fill="black" />
                                            <path d="M13 6V9H12V11H10V12H7V11H5V9H4V6H5V4H7V3H10V4H12V6H13Z" fill="black" />
                                            <path d="M16 16V20H15V21H2V20H1V16H2V15H3V14H4V13H6V14H11V13H13V14H14V15H15V16H16Z" fill="black" />
                                        </svg>
                                    )}
                                    {isCreatingPerson ? "Adding..." : "Add"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && personToDelete && (
                    <div className="fixed inset-0 bg-black/40 font-lexend flex items-center justify-center z-50">
                        <div className="bg-white p-6 space-y-4 max-w-md border-2">
                            <h2 className="text-3xl font-semibold font-playfair text-red-600">Confirm Deletion</h2>
                            <p className="text-gray-700">
                                Are you sure you want to delete <span className="font-semibold">{personToDelete.name}</span>? This action cannot be undone and all associated messages will be permanently removed.
                            </p>
                            <div className="flex justify-between mt-12">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setPersonToDelete(null);
                                    }}
                                    className="px-4 py-2 text-xl bg-gray-200 border-2 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-200 border-2 border-black cursor-pointer flex items-center gap-2 shadow-[5px_5px_0px_0px_rgba(0,0,0)] font-lexend text-xl font-medium hover:shadow-[10px_10px_0px_0px_rgba(0,0,0)] transition duration-200"
                                    disabled={isDeletingPerson}
                                >
                                    {isDeletingPerson ? (
                                        <svg width="24" height="24" className='animate-spin' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12.9999 2H10.9999V8H12.9999V2ZM12.9999 16H10.9999V22H12.9999V16ZM21.9998 11V13L15.9998 13V11H21.9998ZM7.99963 13V11H1.99963V13L7.99963 13ZM14.9996 6.99997H16.9996V8.99997H14.9996V6.99997ZM18.9995 4.99997H16.9995V6.99997H18.9995V4.99997ZM8.99963 6.99997H6.99963V8.99997H8.99963V6.99997ZM4.99973 4.99997H6.99973V6.99997H4.99973V4.99997ZM14.9996 17H16.9995V18.9999H18.9995V16.9999H16.9996V15H14.9996V17ZM6.99963 16.9999V15H8.99963V17H6.99973V18.9999H4.99973V16.9999H6.99963Z" fill="black" />
                                        </svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M5 3H3V21H5H19H21V3H19H5ZM19 5V19H5V5H19ZM16 11H8V13H16V11Z" fill="black" />
                                        </svg>
                                    )}
                                    {isDeletingPerson ? "Removing..." : "Remove"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showMarkDoneModal && messageToMarkDone && (
                    <div className="fixed inset-0 bg-black/40 font-lexend flex items-center justify-center z-50">
                        <div className="bg-white p-6 space-y-4 max-w-md border-2">
                            <h2 className="text-4xl font-semibold font-playfair text-red-500">Are you sure?</h2>
                            <p className="text-gray-700">
                                Have you resolved this issue? Once marked as done, it will be moved to resolved issues.
                            </p>
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                                {messageToMarkDone.emoji && (
                                    <div className="w-10 h-10 relative flex-shrink-0">
                                        <Image
                                            src={`/emoticons/${getEmojiFile(messageToMarkDone.emoji)}`}
                                            alt={`${messageToMarkDone.emoji} emoji`}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                )}
                                {messageToMarkDone.content}
                            </blockquote>
                            <div className="flex justify-between gap-2 mt-12">
                                <button
                                    onClick={() => {
                                        setShowMarkDoneModal(false);
                                        setMessageToMarkDone(null);
                                        setCurrentPersonSlugForMessageAction(null);
                                    }}
                                    className="px-4 py-2 text-xl bg-gray-200 border-2 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmMarkMessageDone}
                                    className="px-4 py-2 bg-red-200 border-2 border-black cursor-pointer flex items-center gap-2 shadow-[5px_5px_0px_0px_rgba(0,0,0)] font-lexend text-xl font-medium hover:shadow-[10px_10px_0px_0px_rgba(0,0,0)] transition duration-200"
                                    disabled={isMarkingMessageDone}
                                >
                                    {isMarkingMessageDone ? (
                                        <svg width="24" height="24" className='animate-spin' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M12.9999 2H10.9999V8H12.9999V2ZM12.9999 16H10.9999V22H12.9999V16ZM21.9998 11V13L15.9998 13V11H21.9998ZM7.99963 13V11H1.99963V13L7.99963 13ZM14.9996 6.99997H16.9996V8.99997H14.9996V6.99997ZM18.9995 4.99997H16.9995V6.99997H18.9995V4.99997ZM8.99963 6.99997H6.99963V8.99997H8.99963V6.99997ZM4.99973 4.99997H6.99973V6.99997H4.99973V4.99997ZM14.9996 17H16.9995V18.9999H18.9995V16.9999H16.9996V15H14.9996V17ZM6.99963 16.9999V15H8.99963V17H6.99973V18.9999H4.99973V16.9999H6.99963Z" fill="black" />
                                        </svg>
                                    ) : (
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M15 6H17V8H15V6ZM13 10V8H15V10H13ZM11 12V10H13V12H11ZM9 14V12H11V14H9ZM7 16V14H9V16H7ZM5 16H7V18H5V16ZM3 14H5V16H3V14ZM3 14H1V12H3V14ZM11 16H13V18H11V16ZM15 14V16H13V14H15ZM17 12V14H15V12H17ZM19 10V12H17V10H19ZM21 8H19V10H21V8ZM21 8H23V6H21V8Z" fill="black" />
                                        </svg>
                                    )}
                                    {isMarkingMessageDone ? "Resolving..." : "Mark as Resolved"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}