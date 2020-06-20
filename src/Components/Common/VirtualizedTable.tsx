import { Theme, withStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import clsx from 'clsx';
import React from 'react';
import { AutoSizer, Column, Table } from 'react-virtualized';

const styles = (theme: Theme): any => ({
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    table: {
        '& .ReactVirtualized__Table__headerRow': {
            flip: false,
            paddingRight: theme.direction === 'rtl' ? '0px !important' : undefined,
            '& .MuiTableCell-head': {
                fontWeight: "bold",
            }
        },
    },
    tableRow: {
        cursor: 'pointer',
    },
    tableRowHover: {
        '&:hover': {
            backgroundColor: theme.palette.grey[200],
        },
    },
    tableCell: {
        flex: 1,
    },
    noClick: {
        cursor: 'initial',
    },
});

const MuiVirtualizedTable = (props: any) => {

    const { classes, columns, rowHeight = 48, onRowClick, headerHeight = 48, ...tableProps } = props;

    const getRowClassName = ({ index }: any) => {

        return clsx(classes.tableRow, classes.flexContainer, {
            [classes.tableRowHover]: index !== -1 && onRowClick != null,
        });
    };

    const cellRenderer = ({ cellData, columnIndex }: any) => {
        return (
            <TableCell
                component="div"
                className={clsx(classes.tableCell, classes.flexContainer, {
                    [classes.noClick]: onRowClick == null,
                })}
                variant="body"
                style={{ height: rowHeight }}
                align={(columnIndex != null && columns[columnIndex].numeric) || false ? 'right' : 'left'}
            >
                {cellData}
            </TableCell>
        );
    };

    const headerRenderer = ({ label, columnIndex }: any) => {
        return (
            <TableCell
                component="div"
                className={clsx(classes.tableCell, classes.flexContainer, classes.noClick)}
                variant="head"
                style={{ height: headerHeight }}
                align={columns[columnIndex].numeric || false ? 'right' : 'left'}
            >
                <span>{label}</span>
            </TableCell>
        );
    };

    return (
        <AutoSizer>
            {({ height, width }: any) => (
                <Table
                    height={height}
                    width={width}
                    rowHeight={rowHeight}
                    gridStyle={{
                        direction: 'inherit',
                    }}
                    headerHeight={headerHeight}
                    className={classes.table}
                    rowClassName={getRowClassName}
                    {...tableProps}
                >
                    {columns.map(({ dataKey, ...other }: any, index: any) => {
                        return (
                            <Column
                                key={dataKey}
                                headerRenderer={(headerProps) =>
                                    headerRenderer({
                                        ...headerProps,
                                        columnIndex: index,
                                    })
                                }
                                className={classes.flexContainer}
                                cellRenderer={cellRenderer}
                                dataKey={dataKey}
                                {...other}
                            />
                        );
                    })}
                </Table>
            )}
        </AutoSizer>
    );
}

export const VirtualizedTable = withStyles(styles)(MuiVirtualizedTable);
