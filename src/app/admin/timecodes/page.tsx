import TimecodesList from '@/components/TimecodesList';
import { getTimecodes } from '@/app/actions/timecodes';

export default async function TimecodesPage() {
    const timecodes = await getTimecodes();

    return (
        <div>
            <TimecodesList timecodes={timecodes} />
        </div>
    );
}
