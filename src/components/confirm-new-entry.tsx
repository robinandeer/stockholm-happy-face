import React, { useCallback, useEffect, useState } from 'react';
import { useInsertEntryWithImage, useInsertEntryWithUrl } from '../graphql/mutations/insert-entry';

import Link from 'next/link';
import { MdArrowBack } from 'react-icons/md';
import buttonStyles from '../styles/button.module.css';
import { useManualQuery } from 'graphql-hooks';
import { useRouter } from 'next/router';
import useTeamsQuery from '../graphql/queries/teams';
import useUserQuery from '../graphql/queries/user';

const IMAGE_QUERY = /* GraphQL */ `
  query Image($url: String!) {
    image(where: { original_url: { _eq: $url } }, limit: 1) {
      id
    }
  }
`;

interface ImageQueryData {
  image: Array<{ id: number }>;
}

interface ImageQueryVariables {
  url: string;
}

const ConfirmNewEntry: React.FC<{ url: string; user: string }> = ({ url, user }) => {
  const router = useRouter();
  const [team, setTeam] = useState<number>();

  const { data: userData } = useUserQuery(user);
  const { data: teamsData } = useTeamsQuery();
  useEffect(() => {
    if (team === undefined) {
      setTeam(userData?.user_by_pk.team?.id || teamsData?.team[0].id);
    }
  }, [team, userData, teamsData]);

  const [fetchImage] = useManualQuery<ImageQueryData | undefined, ImageQueryVariables>(IMAGE_QUERY);

  const insertEntryWithUrl = useInsertEntryWithUrl(user);
  const insertEntryWithImage = useInsertEntryWithImage(user);

  const handleSubmit = useCallback(
    async (event: React.FormEvent): Promise<void> => {
      event.preventDefault();

      if (team) {
        const data = await fetchImage({ variables: { url } });
        if (data.data?.image.length === 1) {
          await insertEntryWithImage(team, data.data.image[0].id);
        } else {
          await insertEntryWithUrl(team, url);
        }
        await router.push('/');
      }
    },
    [insertEntryWithImage, insertEntryWithUrl, team, url, fetchImage, router],
  );

  return (
    <div className="p-6 space-y-10 bg-white border border-black rounded-lg">
      <header className="space-y-6">
        <div>
          <p className="text-xl font-bold text-center">Select this GIF?</p>
          <p className="text-base text-center text-gray-700">
            Pick a GIF to share with your team during this week&apos;s Smileys-session
          </p>
        </div>
        <div className="w-40 mx-auto">
          <div className="h-px bg-black" />
          <div className="h-px bg-black" />
        </div>
      </header>
      <main>
        <img className="mx-auto" src={url} />
      </main>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-center space-x-4">
          <Link href="/entries/new">
            <a className={`${buttonStyles.tertiary} space-x-2`} style={{ height: 'auto' }}>
              <MdArrowBack size="20" />
              <p className="text-base leading-none">Back</p>
            </a>
          </Link>

          <div className="flex">
            <select
              className="border border-r-0 border-black rounded-l-lg rounded-r-none form-select"
              value={team}
              onChange={({ target: { value } }): void => setTeam(parseInt(value))}
              required
            >
              <option disabled>Select team</option>
              {teamsData?.team.map((item) => (
                <option key={item.id} value={item.id}>
                  Post to {item.name}
                </option>
              ))}
            </select>
            <button
              className={buttonStyles.secondary}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, height: 'auto' }}
              type="submit"
            >
              Pick GIF
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConfirmNewEntry;
