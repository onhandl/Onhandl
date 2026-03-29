import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-secondary text-secondary-foreground py-12 border-t border-border">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <a href="#" className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-2">
                                <span className="text-white font-bold text-xl">OF</span>
                            </div>
                            <span className="text-xl font-bold">FlawLess</span>
                        </a>
                        <p className="text-black-400 mb-4">
                            Build powerful AI agents without code. Automate your workflows and save hours of
                            manual work.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Product</h4>
                        <ul className="space-y-2 text-black-400">
                            <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                            <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                            <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                            <li><a href="/sandbox" className="hover:text-white transition-colors">Sandbox</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Company</h4>
                        <ul className="space-y-2 text-black-400">
                            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Career</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-black-400">
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-black-500 text-sm">
                    <p>© {new Date().getFullYear()} FlawLess. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
