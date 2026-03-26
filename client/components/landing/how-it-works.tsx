import React from 'react';

export const HowItWorks: React.FC = () => {
    return (
        <section id="how-it-works" className="py-20 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4" data-aos="fade-up">
                        How It Works
                    </h2>
                    <p
                        className="text-muted-foreground max-w-2xl mx-auto"
                        data-aos="fade-up"
                        data-aos-delay="100"
                    >
                        Building sophisticated AI agents has never been easier. Follow these simple steps to
                        get started.
                    </p>
                </div>

                {/* Step 1 */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-20">
                    <div className="w-full md:w-1/2 order-2 md:order-1" data-aos="fade-right">
                        <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                            Step 1
                        </span>
                        <h3 className="text-2xl font-bold mb-4">
                            Choose your template or start from scratch
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Begin your journey by selecting from our library of pre-built AI agent templates, or
                            start with a blank canvas and build your own from scratch.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Industry-specific templates',
                                'Customizable starting points',
                                'Blank canvas option for full flexibility',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-primary mt-1 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span className="text-black-700 dark:text-black-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full md:w-1/2 order-1 md:order-2" data-aos="fade-left">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-neonblue rounded-lg opacity-20 blur-xl"></div>
                            <div className="relative bg-white dark:bg-foreground p-4 rounded-lg shadow-xl">
                                <div className="bg-gray-100 dark:bg-dark-bg rounded-lg p-6 h-64 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold dark:text-white">Templates</h4>
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {[
                                            { initials: 'CS', label: 'Customer Service', color: 'blue' },
                                            { initials: 'DA', label: 'Data Analysis', color: 'green' },
                                            { initials: 'CG', label: 'Content Generator', color: 'purple' },
                                            { initials: '+', label: 'Blank Canvas', color: 'gray' },
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="bg-white dark:bg-foreground rounded-md p-3 shadow-sm hover:shadow-md cursor-pointer transform hover:scale-105 transition-all"
                                            >
                                                <div
                                                    className={`w-8 h-8 bg-${item.color}-100 dark:bg-${item.color}-900 rounded-md flex items-center justify-center mb-2`}
                                                >
                                                    <span className={`text-${item.color}-600 dark:text-${item.color}-300 text-sm`}>
                                                        {item.initials}
                                                    </span>
                                                </div>
                                                <h5 className="text-sm font-medium dark:text-white">{item.label}</h5>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-20">
                    <div className="w-full md:w-1/2 order-2" data-aos="fade-left">
                        <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                            Step 2
                        </span>
                        <h3 className="text-2xl font-bold mb-4 dark:text-white">
                            Design your workflow with drag and drop
                        </h3>
                        <p className="text-black-600 dark:text-black-400 mb-6">
                            Use our intuitive drag-and-drop interface to create your AI workflow. Connect
                            triggers, actions, and conditions to define how your agent behaves.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Visual flow builder',
                                'Pre-built components',
                                'Smart connectors and logic',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-primary mt-1 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span className="text-black-700 dark:text-black-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full md:w-1/2 order-1" data-aos="fade-right">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-neonblue rounded-lg opacity-20 blur-xl"></div>
                            <div className="relative bg-white dark:bg-foreground p-4 rounded-lg shadow-xl">
                                <div className="bg-gray-100 dark:bg-dark-bg rounded-lg p-6 h-64">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold dark:text-white">Workflow Builder</h4>
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="relative h-44">
                                        {/* Simplified Workflow UI Representation */}
                                        <div className="absolute top-2 left-2 w-20 h-12 bg-blue-500 rounded-md flex items-center justify-center text-white text-xs shadow-md">
                                            Trigger
                                        </div>
                                        <div className="absolute top-2 left-28 w-20 h-12 bg-green-500 rounded-md flex items-center justify-center text-white text-xs shadow-md">
                                            Process
                                        </div>
                                        <div className="absolute top-28 left-40 w-20 h-12 bg-purple-500 rounded-md flex items-center justify-center text-white text-xs shadow-md">
                                            Decision
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="w-full md:w-1/2 order-2 md:order-1" data-aos="fade-right">
                        <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
                            Step 3
                        </span>
                        <h3 className="text-2xl font-bold mb-4 dark:text-white">
                            Test, deploy, and monitor your AI agent
                        </h3>
                        <p className="text-black-600 dark:text-black-400 mb-6">
                            Test your AI agent in real-time, make adjustments as needed, and deploy it with a
                            single click. Monitor performance and scale as your needs grow.
                        </p>
                        <ul className="space-y-3">
                            {[
                                'One-click deployment',
                                'Real-time monitoring',
                                'Seamless iteration and improvement',
                            ].map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 text-primary mt-1 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span className="text-black-700 dark:text-black-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full md:w-1/2 order-1 md:order-2" data-aos="fade-left">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-neonblue rounded-lg opacity-20 blur-xl"></div>
                            <div className="relative bg-white dark:bg-foreground p-4 rounded-lg shadow-xl">
                                <div className="bg-gray-100 dark:bg-dark-bg rounded-lg p-6 h-64">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-semibold dark:text-white">Dashboard</h4>
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white dark:bg-foreground p-3 rounded-md shadow-sm">
                                            <h5 className="text-xs font-medium text-black-500 dark:text-black-400 mb-1">
                                                Active Agents
                                            </h5>
                                            <p className="text-lg font-bold dark:text-white">5</p>
                                        </div>
                                        <div className="bg-background p-3 rounded-md border border-border shadow-sm">
                                            <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                                Executions Today
                                            </h5>
                                            <p className="text-lg font-bold">1,243</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
