import React from 'react';
import { navigate } from 'raviger';

interface PageTitleProps {
    title: string;
    hideBack?: boolean;
    backUrl?: string;
    className?: string;
}

const PageTitle = (props: PageTitleProps) => {
    const { title, hideBack, backUrl, className='' } = props;
    const goBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            window.history.go(-1);
        }
    }
    // 'px-3 md:px-8'
    return (
        <div className={`flex pt-4 ${className}`}>
            {!hideBack && (
                <button onClick={goBack}>
                    <i className="fas fa-chevron-left text-2xl rounded-md p-2 hover:bg-gray-200 mr-1"> </i>
                </button>
            )}

            <h2 className="font-semibold text-2xl leading-tight m-2 ml-0">{title}</h2>
        </div>
    )
};

export default PageTitle;
