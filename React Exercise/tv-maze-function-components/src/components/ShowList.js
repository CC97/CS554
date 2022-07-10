import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import SearchShows from './SearchShows';
import noImage from '../img/download.jpeg';
import { Card, CardActionArea, CardContent, CardMedia, Grid, Typography, makeStyles } from '@material-ui/core';

import '../App.css';
const useStyles = makeStyles({
    card: {
        maxWidth: 250,
        height: 'auto',
        marginLeft: 'auto',
        marginRight: 'auto',
        borderRadius: 5,
        border: '1px solid #1e8678',
        boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);',
    },
    titleHead: {
        borderBottom: '1px solid #1e8678',
        fontWeight: 'bold',
    },
    grid: {
        flexGrow: 1,
        flexDirection: 'row',
    },
    media: {
        height: '100%',
        width: '100%',
    },
    button: {
        color: '#1e8678',
        fontWeight: 'bold',
        fontSize: 12,
    },
});
const ShowList = (props) => {
    const regex = /(<([^>]+)>)/gi;
    const classes = useStyles();
    const [loading, setLoading] = useState(true);
    const [searchData, setSearchData] = useState(undefined);
    const [showsData, setShowsData] = useState(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    let card = null;

    const [pageNumber, setPageNumber] = useState(0);
    const [lastPage, setLastPage] = useState(false);
    const [searchFalse, setSearchFalse] = useState(false);
    let button = null;

    // useEffect(() => {
    //     console.log('on load useeffect');
    //     async function fetchData() {
    //         try {
    //             const { data } = await axios.get('http://api.tvmaze.com/shows');
    //             setShowsData(data);
    //             setLoading(false);
    //             setSearchFalse(false);
    //         } catch (e) {
    //             console.log(e);
    //             setSearchFalse(true);
    //         }
    //     }
    //     fetchData();
    // }, []);

    useEffect(() => {
        console.log('search useEffect fired');
        async function fetchData() {
            try {
                console.log(`in fetch searchTerm: ${searchTerm}`);
                const { data } = await axios.get('http://api.tvmaze.com/search/shows?q=' + searchTerm);
                setSearchData(data);
                setLoading(false);
                setSearchFalse(false);
            } catch (e) {
                console.log(e);
                setSearchFalse(true);
            }
        }
        if (searchTerm) {
            console.log('searchTerm is set');
            fetchData();
        }
    }, [searchTerm]);

    useEffect(() => {
        if (props.match.params.pageNumber) {
            setPageNumber(parseInt(props.match.params.pageNumber.trim()));
        }

        async function fetchData() {
            try {
                const { data } = await axios.get('http://api.tvmaze.com/shows?page=' + pageNumber);
                console.log(data);
                setShowsData(data);
                setLoading(false);
                setSearchFalse(false);
            } catch (error) {
                console.log(error);
                setSearchFalse(true);
            }
            try {
                const { data } = await axios.get('http://api.tvmaze.com/shows?page=' + (pageNumber + 1));
                setLastPage(false);
            } catch (error) {
                setLastPage(true);
            }
        }
        fetchData();
    }, [pageNumber, props.match.params.pageNumber]);

    const searchValue = async (value) => {
        setSearchTerm(value);
    };
    const buildCard = (show) => {
        return (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={show.id}>
                <Card className={classes.card} variant="outlined">
                    <CardActionArea>
                        <Link to={`/shows/${show.id}`}>
                            <CardMedia
                                className={classes.media}
                                component="img"
                                image={show.image && show.image.original ? show.image.original : noImage}
                                title="show image"
                            />

                            <CardContent>
                                <Typography className={classes.titleHead} gutterBottom variant="h6" component="h3">
                                    {show.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" component="p">
                                    {show.summary
                                        ? show.summary.replace(regex, '').substring(0, 139) + '...'
                                        : 'No Summary'}
                                    <span>More Info</span>
                                </Typography>
                            </CardContent>
                        </Link>
                    </CardActionArea>
                </Card>
            </Grid>
        );
    };

    if (searchTerm) {
        card =
            searchData &&
            searchData.map((shows) => {
                let { show } = shows;
                return buildCard(show);
            });
    } else {
        card =
            showsData &&
            showsData.map((show) => {
                return buildCard(show);
            });
    }

    if (loading) {
        return (
            <div>
                <h2>Loading....</h2>
            </div>
        );
    } else {
        if (pageNumber === 0) {
            button = (
                <Link className="showlink" to={`/shows/page/${parseInt(pageNumber) + 1}`}>
                    Next Page
                </Link>
            );
        } else if (lastPage === true) {
            button = (
                <Link className="showlink" to={`/shows/page/${parseInt(pageNumber) - 1}`}>
                    Previous Page
                </Link>
            );
        } else {
            button = (
                <div>
                    <Link className="showlink" to={`/shows/page/${parseInt(pageNumber) - 1}`}>
                        Previous Page
                    </Link>
                    <Link className="showlink" to={`/shows/page/${parseInt(pageNumber) + 1}`}>
                        Next Page
                    </Link>
                </div>
            );
        }

        if (searchFalse) {
            return (
                <div>
                    <SearchShows searchValue={searchValue} />
                    <br />
                    <Link className="showlink" to="/shows/page/0">
                        Go To First Page
                    </Link>

                    <br />
                    <br />
                    <h1>404 - TV Maze Not Found!</h1>
                </div>
            );
        } else {
            return (
                <div>
                    <SearchShows searchValue={searchValue} />
                    <br />
                    {button}

                    {/* <button onClick={() => setPageNumber(pageNumber - 1)}>Last page</button>
                <button onClick={() => setPageNumber(pageNumber + 1)}>Next page</button> */}

                    <br />
                    <br />

                    <Grid container className={classes.grid} spacing={5}>
                        {card}
                    </Grid>
                </div>
            );
        }
    }
};

export default ShowList;
