import { ReactElement, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "src/components/Button"
import NewTokenDialog from "./NewTokenDialog"
import {
  Repo,
  getUploadTokens,
  revokeUploadToken,
} from "src/asyncs/upload_tokens"
import { useAsync } from "src/hooks/useAsync"
import Spinner from "src/components/Spinner"
import { getIntlLocale } from "src/localize"
import { i18n } from "next-i18next"
import ConfirmDialog from "src/components/ConfirmDialog"

export default function UploadTokenControls({ app }) {
  const { t } = useTranslation()

  const [modalVisible, setModalVisible] = useState(false)
  const [repo, setRepo] = useState<Repo>("beta")
  const [showExpired, setShowExpired] = useState(false)

  const {
    execute: refreshTokens,
    value: tokens,
    status,
  } = useAsync(
    useCallback(
      () => getUploadTokens(app.id, showExpired),
      [app.id, showExpired],
    ),
    true,
  )

  const [tokenToRevoke, setTokenToRevoke] = useState<number | undefined>(
    undefined,
  )

  const revoke = useCallback(() => {
    revokeUploadToken(tokenToRevoke).then(() => {
      setTokenToRevoke(undefined)
      refreshTokens()
    })
  }, [tokenToRevoke, refreshTokens])

  let content: ReactElement
  if (status === "pending" || status === "idle") {
    content = <Spinner size="m" />
  } else if (status === "error") {
    content = <p>{t("error-occurred")}</p>
  } else {
    content = (
      <>
        <div className="grid w-full grid-cols-2 gap-4">
          <Button
            onClick={() => {
              setRepo("beta")
              setModalVisible(true)
            }}
          >
            {t("new-beta-token")}
          </Button>
          {tokens.is_direct_upload_app && (
            <Button
              onClick={() => {
                setRepo("stable")
                setModalVisible(true)
              }}
            >
              {t("new-stable-token")}
            </Button>
          )}
        </div>

        {tokens.tokens.length === 0 && (
          <p className="mt-6">{t("no-tokens-to-show")}</p>
        )}

        {tokens.tokens.length > 0 && (
          <div className="overflow-x-auto w-full">
            <table className="mt-6 w-full">
              <thead>
                <tr>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("id")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("name")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("repo")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("scopes")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("issued")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("issued-to")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("expires")}
                  </th>
                  <th className="text-left pe-5 whitespace-nowrap">
                    {t("status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokens.tokens.map((token) => (
                  <tr key={token.id}>
                    <td className="pe-5">{token.id}</td>
                    <td className="pe-5">{token.comment}</td>
                    <td className="pe-5">{token.repos.join(", ")}</td>
                    <td className="pe-5">{token.scopes.join(", ")}</td>
                    <td className="pe-5">
                      {new Date(token.issued_at * 1000).toLocaleDateString(
                        getIntlLocale(i18n.language),
                      )}
                    </td>
                    <td className="pe-5">{token.issued_to}</td>
                    <td className="pe-5">
                      {new Date(token.expires_at * 1000).toLocaleDateString(
                        getIntlLocale(i18n.language),
                      )}
                    </td>
                    <td>
                      {token.revoked ? (
                        t("revoked")
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setTokenToRevoke(token.id)
                          }}
                        >
                          {t("revoke")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!showExpired && (
          <Button className="mt-4" onClick={() => setShowExpired(true)}>
            {t("show-expired-tokens")}
          </Button>
        )}
      </>
    )
  }

  return (
    <>
      <h2 className="mb-6 text-2xl font-bold">{t("upload-tokens")}</h2>
      {content}

      <NewTokenDialog
        visible={modalVisible}
        cancel={() => setModalVisible(false)}
        created={() => refreshTokens()}
        app_id={app.id}
        repo={repo}
      />

      <ConfirmDialog
        isVisible={tokenToRevoke !== undefined}
        action={t("revoke-token")}
        prompt={t("revoke-token")}
        actionVariant="destructive"
        onConfirmed={() => revoke()}
        onCancelled={() => setTokenToRevoke(undefined)}
      >
        {t("revoke-token-description", {
          name: tokens?.tokens.find((token) => token.id === tokenToRevoke)
            ?.comment,
        })}
      </ConfirmDialog>
    </>
  )
}
