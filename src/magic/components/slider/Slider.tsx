/* Vendored from react-magic-ui — MIT, Copyright (c) 2025 tweeedlex.
   https://github.com/tweeedlex/react-magic-ui
   Kept byte-faithful on purpose: this file is NOT covered by Opale's colour
   contract and is not styled with Opale's tokens. See src/magic/README.md. */
/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/no-static-element-interactions -- écart assumé au profit de la fidélité.
   Deux défauts réels de leur `Slider`, gardés tels quels :
   - `showValue` est déstructuré mais jamais lu : cette prop n'a aucun effet ;
   - la piste est un `<div>` sans rôle, sans tabindex et sans clavier.
   La surface Glass est ajoutée par Opale pour aligner ce dernier composant sur
   le matériau liquide commun. Seule la poignée se déplace après une prise en
   main, en continu à l'écran, même lorsque `step` arrondit la valeur émise.
   À corriger en amont chez tweeedlex, pas par une divergence locale. */
/* ÉCART OPALE — LES GESTIONNAIRES DE POINTEUR PASSENT DE LA POIGNÉE À LA PISTE.

   Chez eux, `onPointerDown`, `onPointerMove` et `onPointerUp` sont posés sur la
   seule POIGNÉE. Conséquence mesurable : la piste est morte. Un clic dessus ne
   déplace rien, et la moitié des gestes réels — on vise la barre, pas la
   capsule de 36 px — n'obtient aucune réponse. Le composant ne « suit pas le
   curseur » parce qu'il n'écoute pas là où le curseur descend.

   La capture de pointeur héritait du même défaut : elle était prise sur la
   poignée. Elle est désormais prise sur la piste, qui est l'élément dont le
   rectangle sert de repère à `updateValue`. C'est ce qui garantit que le geste
   continue à être suivi quand le pointeur SORT du composant — la poignée, elle,
   se dérobe sous le curseur dès qu'on va plus vite qu'elle.

   CE QUI N'A PAS CHANGÉ, PARCE QUE LA MESURE NE LE DEMANDAIT PAS : il n'y a
   AUCUNE transition sur `left` (poignée) ni sur `width` (`.trackFill`) dans
   `Slider.module.scss`. La seule transition de la poignée porte sur
   `transform`, qui n'encode que le centrage et l'agrandissement au survol, pas
   la position. Le rendu ne traînait donc pas derrière le curseur : il ne
   partait pas du tout. La position reste pilotée par `left` plutôt que par un
   `translate3d` — le gain serait théorique sur un unique élément absolu de
   6 px de haut, et le coût serait une divergence de plus sur du code vendoré.

   `updateValue` centre la poignée SUR le curseur, y compris quand le geste
   commence sur la capsule elle-même : c'est le comportement d'origine, et
   c'est littéralement « glisser avec le curseur ». Conserver l'écart de prise
   en main aurait été un changement de comportement, pas une correction. */

import React, { useState, useRef, type PointerEvent } from "react";
import styles from "./style/Slider.module.scss";
import clsx from "clsx";
import Glass from "../glass/Glass";

export type SliderProps = {
    disabled?: boolean;
    size?: "small" | "medium" | "large";
    min?: number;
    max?: number;
    step?: number;
    value?: number;
    onChange?: (value: number) => void;
    showValue?: boolean;
    enableClickAnimation?: boolean;
};

const Slider: React.FC<SliderProps> = ({
    size = "medium",
    disabled,
    min = 0,
    max = 100,
    step = 1,
    value = 50,
    onChange,
    showValue = false,
    enableClickAnimation = true,
    ...props
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragPercentage, setDragPercentage] = useState<number | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    const displayedPercentage = dragPercentage ?? percentage;

    const updateValue = (clientX: number) => {
        if (!sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const width = rect.width;
        let newPercentage = (offsetX / width) * 100;

        // Clamp percentage between 0 and 100
        newPercentage = Math.max(0, Math.min(100, newPercentage));
        setDragPercentage(newPercentage);

        // Calculate new value
        let newValue = min + (newPercentage / 100) * (max - min);

        // Apply step
        newValue = Math.round(newValue / step) * step;

        // Clamp value between min and max
        newValue = Math.max(min, Math.min(max, newValue));

        if (onChange && newValue !== value) {
            onChange(newValue);
        }
    };

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (disabled) return;

        /* jsdom n'implémente pas l'API de capture de pointeur : sans cette
           garde, le moindre clic sur un slider rendu dans un test lèverait un
           TypeError. La garde n'a aucun effet dans un navigateur. */
        if (typeof e.currentTarget.setPointerCapture === "function") {
            e.currentTarget.setPointerCapture(e.pointerId);
        }
        setIsDragging(true);
        updateValue(e.clientX);
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (isDragging && !disabled) {
            updateValue(e.clientX);
        }
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
        setDragPercentage(null);
    };

    return (
        <Glass
            rootStyle={{ width: "100%" }}
            enableLiquidAnimation={!disabled && enableClickAnimation}
            {...props}
            className={clsx(styles.sliderContainer, styles[size], disabled && styles.disabled)}
        >
            <div
                ref={sliderRef}
                className={clsx(styles.sliderTrack, styles[size])}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className={clsx(styles.trackBackground, styles[size])}>
                    <div
                        className={styles.trackFill}
                        style={{ width: `${displayedPercentage}%` }}
                    />
                </div>
                <div
                    className={clsx(styles.thumb, isDragging && styles.dragging)}
                    style={{ left: `${displayedPercentage}%` }}
                />
            </div>
        </Glass>
    );
};

export default Slider;
