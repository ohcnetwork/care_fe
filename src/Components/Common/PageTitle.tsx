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
        <div>
            {!hideBack && (<IconButton onClick={goBack}>
                <ArrowBackIosOutlinedIcon />
            </IconButton>)}
            <h2 className="font-semibold text-2xl leading-tight px-3 md:px-8 pt-4">{title}</h2>
        </div>
    )
};

export default PageTitle;
