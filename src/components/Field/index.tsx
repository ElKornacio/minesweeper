import useVirtualization from '../../hooks/useVirtualization';
import useField from '../../hooks/useField';

import FieldContent from './FieldContent';

import { cellSize } from '../../types/consts';
import ColorizationPromise from '../../types/ColorizationPromise';
import FieldArray from '../../types/FieldArray';
import IGameParams from '../../types/IGameParams';

import './style.scss';

export interface IFieldProps {
    emptySubstitute: number | null;
    params: IGameParams;
    field: FieldArray;
    colorizationPromise: ColorizationPromise;

    onFieldUpdate: (newField: Uint8Array) => void;
    onGameStateUpdate: (newState: 'none' | 'win' | 'lose') => void;
    onAddFlag: () => void;
    onRemoveFlag: () => void;
}

export default function Field(props: IFieldProps) {
    const { params, field } = props;

    const { ref, slice, handleWheel } = useVirtualization({
        params: params,
        cellSize: cellSize,
        overHead: 3
    });

    const { handleCellClick } = useField(props);

    return (
        <div
            ref={ref}
            className="field-wrapper"
            onWheel={handleWheel}
        >
            <FieldContent
                onCellClick={handleCellClick}
                slice={slice}
                field={field}
                params={params}
            />
        </div>
    );
}