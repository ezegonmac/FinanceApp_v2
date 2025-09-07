interface Props {
    message: string | null | undefined;
}

export default function ErrorMessage({ message }: Props) {
    if (!message) return null;
    if (message === undefined) return null;
    return (
        <p style={{ backgroundColor: 'lightcoral', padding: '0.5em' }}>
            {message}
        </p>
    );
}