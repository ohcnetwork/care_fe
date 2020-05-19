import React from 'react';
import { navigate } from 'hookrouter';

interface PageTitleProps {
    title: string;
    hideBack?: boolean;
    backUrl?: string;
}

const PageTitle = (props: PageTitleProps) => {
    const { title, hideBack, backUrl } = props;
    const goBack = () => {
        if (backUrl) {
            navigate(backUrl);
        } else {
            window.history.go(-1);
        }
    }
    return (
        <div className="flex px-3 md:px-8 pt-4">
            {!hideBack && (
                <button onClick={goBack}>
                    <i className="fas fa-chevron-left text-2xl rounded-full p-2 hover:bg-gray-200"> </i>
                </button>
            )}

            <h2 className="font-semibold text-2xl p-2 leading-tight">{title}</h2>
        </div>
    )
};

export default PageTitle;
