import React from 'react';

interface NavigationProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    handleAnchorClick: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    handleAnchorClick,
}) => {
    return (
        <nav className="fixed w-full z-50 backdrop-blur-md bg-background/80 shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <a href="#" className="flex items-center">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white font-bold text-xl">OF</span>
                    </div>
                    <span className="text-xl font-bold">FlawLess</span>
                </a>
                <div className="hidden md:flex space-x-8">
                    {['Features', 'How It Works', 'Testimonials', 'Pricing', 'FAQ'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                            className="font-medium hover:text-primary transition-colors duration-300"
                            onClick={(e) => handleAnchorClick(e, `#${item.toLowerCase().replace(/ /g, '-')}`)}
                        >
                            {item}
                        </a>
                    ))}
                </div>
                <div className="flex items-center space-x-6">
                    <a href="/signin" className="font-medium hover:text-primary transition-colors">
                        Sign In
                    </a>
                    <a
                        href="/signup"
                        className="hidden sm:block px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Sign Up Free
                    </a>
                    <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
            {/* Mobile menu */}
            <div className={`md:hidden px-4 py-2 bg-card shadow-lg ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
                {['Features', 'How It Works', 'Testimonials', 'Pricing', 'FAQ', 'Waitlist'].map((item) => (
                    <a
                        key={item}
                        href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                        className="block py-2 font-medium hover:text-primary"
                        onClick={(e) => handleAnchorClick(e, `#${item.toLowerCase().replace(/ /g, '-')}`)}
                    >
                        {item}
                    </a>
                ))}
            </div>
        </nav>
    );
};
