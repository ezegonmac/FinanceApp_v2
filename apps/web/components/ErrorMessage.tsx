interface Props {
    message: string | null;
}

export default function ErrorMessage({ message }: Props) {
    if (!message) return null;
    return (
        <p style={{ backgroundColor: 'lightcoral', padding: '0.5em' }}>
            {message}
        </p>
    );
}