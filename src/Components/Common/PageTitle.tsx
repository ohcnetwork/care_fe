import React from 'react';
import { IconButton } from '@material-ui/core';
import ArrowBackIosOutlinedIcon from "@material-ui/icons/ArrowBackIosOutlined";
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
        <div className="flex py-4 mt-4 border-b-4 border-orange-500">
            {!hideBack && (<IconButton onClick={goBack}>
                <ArrowBackIosOutlinedIcon />
            </IconButton>)}
            <span className="font-semibold text-3xl">{title}</span>
        </div>
    )
};

export default PageTitle;