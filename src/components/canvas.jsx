import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';


export default function Canvas(props) {
    const canvasRef = useRef(null);
    const [stroke, setStroke] = useState(1);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [last, setLast] = useState({ x: 0, y: 0 });
    const DRAW = { width: 20, height: 20 };
    const ZOOM = 10;
    const FG_COLOR = 'blue';

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = DRAW.width;
        canvas.height = DRAW.height;
        canvas.style.width = `${ZOOM * canvas.width}.px`;
        canvas.style.height = `${ZOOM * canvas.height}px`;
        const ctx = canvas.getContext("2d");
        // ctx.scale(1, 1);
        ctx.lineJoin = ctx.lineCap = 'round';
        ctx.strokeStyle = FG_COLOR;
        ctx.lineWidth = stroke;

        contextRef.current = ctx;
        // console.log(canvas.style.width)

    }, [DRAW.width, DRAW.height, ZOOM, stroke]);

    const handleChange = (event) => {
        setStroke(event.target.value);
    };

    function eventCanvasCoord(canvas, ev) {
        const x = (ev.pageX - canvas.offsetLeft) / ZOOM;
        const y = (ev.pageY - canvas.offsetTop) / ZOOM;
        return { x, y };
    }

    function draw(pt0, pt1) {
        contextRef.current.beginPath();
        contextRef.current.moveTo(pt0.x, pt0.y);
        contextRef.current.lineTo(pt1.x, pt1.y);
        contextRef.current.stroke();

    }
    const handleMouseDown = (e) => {
        setIsDrawing(true);
        setLast(eventCanvasCoord(canvasRef.current, e));
        // console.log(last);
    }

    const handleMouseUp = (e) => {
        setIsDrawing(false);
    }

    //handle mouse out
    const handleMouseOut = (e) => {
        setIsDrawing(false);
    }



    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const pt = eventCanvasCoord(canvasRef.current, e);
        draw(last, pt);
        setLast(pt);
    }

    const clear = () => {

        contextRef.current.clearRect(0, 0, DRAW.width, DRAW.height);
        props.onChange(null);
    }

    const submit = () => {
        const canvas = contextRef.current;
        props.getImage(canvas)
    }

    return (
        <div className="container">
            <div className="draw-area">
                <canvas
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseOut={handleMouseOut}
                    ref={canvasRef}
                ></canvas>
            </div>

            <p className="draw-area-text">Drawing Area</p>
            <div style={{ display: "flex", justifyContent: "center" }}>

                <Button
                    variant="contained"
                    color="primary"
                    className="clear-button"
                    onClick={clear}
                >
                    Clear
                </Button>


                <Button
                    variant="contained"
                    color="primary"
                    className="submit-button"
                    onClick={submit}
                >
                    Submit
                </Button>

            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
                <InputLabel id="demo-simple-select-label">Pen Width</InputLabel>
                <Select
                    value={stroke}
                    label="Pen Width"
                    onChange={handleChange}
                    defaultValue={stroke}
                >
                    <MenuItem value={1}>1</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                </Select>

            </div>
        </div>
    );

}