import React from 'react';

interface FormButtonProps {
    isLoading: boolean;
    loadingText: string;
    buttonText: string;
    type?: 'button' | 'submit' | 'reset';
}

export default function FormButton({
    isLoading,
    loadingText,
    buttonText,
    type = 'submit'
}: FormButtonProps) {
    return (
        <button
            type={type}
            className="w-full py-2 px-4 bg-red-200 font-medium transition duration-300 border-2 shadow-[5px_5px_0px_0px_rgba(0,0,0)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0)] hover:cursor-pointer flex items-center justify-center gap-2"
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <svg width="24" height="24" className='animate-spin' viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12.9999 2H10.9999V8H12.9999V2ZM12.9999 16H10.9999V22H12.9999V16ZM21.9998 11V13L15.9998 13V11H21.9998ZM7.99963 13V11H1.99963V13L7.99963 13ZM14.9996 6.99997H16.9996V8.99997H14.9996V6.99997ZM18.9995 4.99997H16.9995V6.99997H18.9995V4.99997ZM8.99963 6.99997H6.99963V8.99997H8.99963V6.99997ZM4.99973 4.99997H6.99973V6.99997H4.99973V4.99997ZM14.9996 17H16.9995V18.9999H18.9995V16.9999H16.9996V15H14.9996V17ZM6.99963 16.9999V15H8.99963V17H6.99973V18.9999H4.99973V16.9999H6.99963Z" fill="black" />
                    </svg>
                    <span>{loadingText}</span>
                </>
            ) : (
                buttonText
            )}
        </button>
    );
}